from rest_framework.viewsets import ModelViewSet
from ..models import Project, Stakeholders, Taskactivities, ProjectStaff
from .serializers import *
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser, BasePermission
from django.contrib.auth.models import User
from rest_framework import generics
from rest_framework.response import Response
from django.db.models import Count
from rest_framework.exceptions import PermissionDenied
from django.contrib.admin.models import LogEntry
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class IsSuperUser(BasePermission):
    """Only full administrators may access this resource."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_superuser)


def visible_projects(user):
    """Scope projects by role:
    - Super admin  -> all projects
    - Manager      -> projects they created
    - Staff        -> projects they are assigned to"""
    if user.is_superuser:
        return Project.objects.all()
    created = Project.objects.filter(created_by=user)
    assigned = Project.objects.filter(staff__user=user)
    return (created | assigned).distinct()


def visible_tasks(user):
    """Scope tasks by role:
    - Super admin  -> all tasks
    - Manager      -> tasks on projects they lead
    - Staff        -> tasks they logged themselves"""
    if user.is_superuser:
        return Taskactivities.objects.all()
    if user.is_staff:
        return Taskactivities.objects.filter(project__created_by=user)
    return Taskactivities.objects.filter(user=user)


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Adds the user's name and role (is_staff) to the JWT, so the UI can
    show who is logged in and whether they are a Manager/Admin or Staff."""
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['first_name'] = user.first_name
        token['last_name'] = user.last_name
        token['email'] = user.email
        token['is_staff'] = user.is_staff
        token['is_superuser'] = user.is_superuser
        return token


class MeView(generics.GenericAPIView):
    """Returns the profile of the currently authenticated user."""
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        return Response({
            "id": user.id,
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "is_staff": user.is_staff,
            "is_superuser": user.is_superuser,
            "role": "superadmin" if user.is_superuser else ("manager" if user.is_staff else "staff"),
            "date_joined": user.date_joined,
        })


class DashboardStats(generics.GenericAPIView):
    """Aggregated numbers for the dashboard."""
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        projects = visible_projects(user)
        tasks = visible_tasks(user)
        stakeholders = Stakeholders.objects.filter(project__in=projects)

        closed_projects = projects.filter(status__iexact="Closed").count()
        open_projects = projects.filter(status__iexact="Open").count()
        total = projects.count()

        my_tasks = Taskactivities.objects.filter(user=user).count()

        # Projects created by this user (used for "your work" stats)
        my_projects = projects.filter(created_by=user).count()

        data = {
            "total_projects": total,
            "open_projects": open_projects,
            "in_progress_projects": max(total - closed_projects - open_projects, 0),
            "closed_projects": closed_projects,
            "total_tasks": tasks.count(),
            "my_tasks": my_tasks,
            "my_projects": my_projects,
            "total_stakeholders": stakeholders.count(),
            "status_breakdown": list(
                projects.values("status").annotate(count=Count("id")).order_by("status")
            ),
            "tasks_by_user": list(
                projects.exclude(created_by=None)
                .values("created_by__first_name", "created_by__last_name")
                .annotate(count=Count("id"))
                .order_by("-count")[:8]
            ),
            "recent_projects": ProjectSerializer(
                projects.order_by("-created_at")[:5], many=True
            ).data,
        }
        return Response(data)


class OwnerModifyMixin:
    """Shared rule: a record may only be updated/deleted by the user who
    created it, or by a Manager (is_staff). Records without a creator are
    treated as Manager-owned (legacy/seed data)."""
    owner_field = "created_by_id"

    def check_object_permissions(self, request, obj):
        super().check_object_permissions(request, obj)
        if self.action in ("update", "partial_update", "destroy"):
            owner_id = getattr(obj, self.owner_field, None)
            if not request.user.is_staff and owner_id != request.user.id:
                raise PermissionDenied("You can only modify records you created.")


class ProjectViewSer(OwnerModifyMixin, ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return visible_projects(self.request.user).order_by("-id")

    def perform_create(self, serializer):
        if not (self.request.user.is_staff or self.request.user.is_superuser):
            raise PermissionDenied("Only project leads (managers) can create projects.")
        serializer.save(created_by=self.request.user)

class ProjectCreate(generics.ListCreateAPIView):
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return visible_projects(self.request.user).order_by("-id")

    def perform_create (self, serializer):
        if not (self.request.user.is_staff or self.request.user.is_superuser):
            raise PermissionDenied("Only project leads (managers) can create projects.")
        if serializer.is_valid():
            serializer.save(created_by=self.request.user)
        else:
            print(serializer.errors)

class GetSpecificProject(generics.ListAPIView):
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        iid = self.kwargs.get('iid')
        return visible_projects(self.request.user).filter(id=iid)


class StakeholdersViewSet(OwnerModifyMixin, ModelViewSet):
    serializer_class = StakeholdersSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Stakeholders.objects.filter(project__in=visible_projects(self.request.user)).order_by("-id")

    def perform_create(self, serializer):
        if not (self.request.user.is_staff or self.request.user.is_superuser):
            raise PermissionDenied("Only managers or super admins can add stakeholders.")
        serializer.save(created_by=self.request.user)


class ProjectStaffView(ModelViewSet):
    """Staff members assigned to a project with a KPI/summary of their role."""
    serializer_class = ProjectStaffSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = ProjectStaff.objects.select_related("user", "project").filter(
            project__in=visible_projects(self.request.user)
        )
        project_id = self.request.query_params.get("project")
        if project_id:
            qs = qs.filter(project_id=project_id)
        return qs.order_by("user__first_name", "user__last_name")

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def _may_manage(self, request, obj):
        if request.user.is_staff:
            return True
        if obj.project.created_by_id == request.user.id:
            return True
        return obj.created_by_id == request.user.id

    def create(self, request, *args, **kwargs):
        project = Project.objects.filter(id=request.data.get("project")).first()
        if not (request.user.is_staff or (project and project.created_by_id == request.user.id)):
            raise PermissionDenied("Only the project owner or a manager can assign staff.")
        return super().create(request, *args, **kwargs)

    def check_object_permissions(self, request, obj):
        super().check_object_permissions(request, obj)
        if self.action in ("update", "partial_update", "destroy") and not self._may_manage(request, obj):
            raise PermissionDenied("Only the project owner or a manager can manage staff.")


class UserViewSet(ModelViewSet):
    """Directory & management of users.
    - list/retrieve: managers and super admins (used to assign staff)
    - create/update/delete + role changes: super admins only"""
    serializer_class = UsersSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff or self.request.user.is_superuser:
            return User.objects.all().order_by("first_name", "last_name")
        return User.objects.none()

    def create(self, request, *args, **kwargs):
        if not request.user.is_superuser:
            raise PermissionDenied("Only a super admin can create staff accounts.")
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        if not request.user.is_superuser:
            raise PermissionDenied("Only a super admin can update staff accounts.")
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        if not request.user.is_superuser:
            raise PermissionDenied("Only a super admin can update staff accounts.")
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if not request.user.is_superuser:
            raise PermissionDenied("Only a super admin can delete staff accounts.")
        target = self.get_object()
        if target.id == request.user.id:
            raise PermissionDenied("You cannot delete your own account.")
        return super().destroy(request, *args, **kwargs)

class StakeholderCreate(generics.ListCreateAPIView):
    serializer_class = StakeholdersSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Stakeholders.objects.filter(project__in=visible_projects(self.request.user)).order_by("-id")
    
    def perform_create (self, serializer):
        if not (self.request.user.is_staff or self.request.user.is_superuser):
            raise PermissionDenied("Only managers or super admins can add stakeholders.")
        if serializer.is_valid():
            serializer.save(created_by=self.request.user)
        else:
            print(serializer.errors)

class GetSpecificStakeholder(generics.ListCreateAPIView):
    serializer_class = StakeholdersSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        iid = self.kwargs.get('iid') 
        if not visible_projects(self.request.user).filter(id=iid).exists():
            return Stakeholders.objects.none()
        return Stakeholders.objects.filter(project_id=iid).order_by("-id")


class TaskViewSet(OwnerModifyMixin, ModelViewSet):
    serializer_class = AlltaskSerializer
    permission_classes = [IsAuthenticated]
    owner_field = "user_id"

    def get_queryset(self):
        return visible_tasks(self.request.user).order_by("-id")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class TaskCreate(generics.ListCreateAPIView):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        usr = self.request.user
        return Taskactivities.objects.filter(user=usr).order_by("-id")
    
    def perform_create (self, serializer):
        if serializer.is_valid():
            serializer.save(user=self.request.user)
        else:
            print(serializer.errors)

class GetSpecificTask(generics.ListAPIView):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        iid = self.kwargs.get('iid')
        if not visible_projects(self.request.user).filter(id=iid).exists():
            return Taskactivities.objects.none()
        return Taskactivities.objects.filter(project_id=iid).order_by("-id")
        
class TaskDetail(generics.RetrieveUpdateAPIView):
    serializer_class = TaskSerializer

    def get_queryset(self):
        return visible_tasks(self.request.user)

    def perform_update(self, serializer):
        task = self.get_object()
        if task.user != self.request.user and not self.request.user.is_staff:
            raise PermissionDenied("You can only update your own tasks.")
        serializer.save()

class LogDetail(generics.ListAPIView):
    queryset = LogEntry.objects.all().order_by('-id')
    serializer_class = LogSerializer
    # Activity log is only for Super Admins
    permission_classes = [IsSuperUser]

class TaskDelete (generics.DestroyAPIView):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Owners can delete their own tasks; Managers/Super admins scope by role.
        return visible_tasks(self.request.user)

class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]