from rest_framework import serializers
from rest_framework.serializers import ModelSerializer, SerializerMethodField
from ..models import Project, Stakeholders, Taskactivities, ProjectStaff
from django.contrib.auth.models import User
from django.contrib.admin.models import LogEntry

class LogSerializer(ModelSerializer):
    user_name = SerializerMethodField()
    class Meta:
        model = LogEntry
        fields = ('action_time', 'action_flag', 'object_repr', 'user', 'user_name', 'change_message') 
    def get_user_name(self, obj):
        return obj.user.get_full_name()
    
class ProjectSerializer(ModelSerializer):
    created_by_name = SerializerMethodField()
    class Meta:
        model = Project
        fields = ('id', 'name', 'details', 'startdate', 'enddate', 'status', 'progress', 'created_at', 'created_by', 'created_by_name')
        extra_kwargs = {'created_by': {'read_only': True}}

    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.username
        return ""

class ProjectStaffSerializer(ModelSerializer):
    project_name = SerializerMethodField()
    user_name = SerializerMethodField()
    is_manager = SerializerMethodField()
    task_count = SerializerMethodField()

    class Meta:
        model = ProjectStaff
        fields = ('id', 'project', 'project_name', 'user', 'user_name', 'is_manager',
                  'responsibility', 'kpi', 'task_count', 'created_at')
        extra_kwargs = {'project': {'required': True}, 'user': {'required': True}}

    def get_project_name(self, obj):
        return obj.project.name

    def get_user_name(self, obj):
        return obj.user.get_full_name() or obj.user.username

    def get_is_manager(self, obj):
        return obj.user.is_staff

    def get_task_count(self, obj):
        return Taskactivities.objects.filter(project=obj.project, user=obj.user).count()

    def validate(self, attrs):
        project = attrs.get('project', getattr(self.instance, 'project', None))
        user = attrs.get('user', getattr(self.instance, 'user', None))
        if project and user:
            qs = ProjectStaff.objects.filter(project=project, user=user)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError("This staff member is already assigned to the project.")
        return attrs

class UsersSerializer(ModelSerializer):
    full_name = SerializerMethodField()
    role = SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'username', 'first_name', 'last_name', 'full_name', 'email',
                  'is_staff', 'is_superuser', 'role', 'password', 'date_joined')
        extra_kwargs = {'password': {'write_only': True, 'required': False},
                        'date_joined': {'read_only': True}}

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username

    def get_role(self, obj):
        if obj.is_superuser:
            return "superadmin"
        if obj.is_staff:
            return "manager"
        return "staff"

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        if not password:
            raise serializers.ValidationError({"password": "Password is required."})
        user = User.objects.create_user(**validated_data, password=password)
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for field, value in validated_data.items():
            setattr(instance, field, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance

class StakeholdersSerializer(ModelSerializer):
    project_name = SerializerMethodField()
    class Meta:
        model = Stakeholders
        fields = ('id', 'project', 'project_name', 'name', 'email', 'position', 'activity', 'created_at', 'created_by')
        extra_kwargs = {'created_by': {'read_only': True}}
        
    def get_project_name(self, obj):
        return obj.project.name

class TaskSerializer(ModelSerializer):
    project_name = SerializerMethodField()
    user_name = SerializerMethodField()
    class Meta:
        model = Taskactivities
        fields = ('id', 'project', 'project_name', 'user','user_name', 'task', 'notes', 'challenges', 'created_at')
        # 'project' is optional so updating a task (which does not resend the project) still works
        extra_kwargs = {'user': {'read_only': True}, 'project': {'required': False}}
    
    def get_project_name(self, obj):
        return obj.project.name
    def get_user_name(self, obj):
        return obj.user.get_full_name()

class UserSerializer (ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'email', 'username', 'password']
        # fields = '__all__'
        extra_kwargs = {"password": {'write_only': True}}

    # Note: this must live on the serializer (not inside Meta) so DRF actually
    # uses it - it ensures the password is stored hashed via create_user().
    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user
        
class AlltaskSerializer(ModelSerializer):
    project_name = SerializerMethodField()
    user_name = SerializerMethodField()
    class Meta:
        model = Taskactivities
        fields = ('id', 'project', 'project_name', 'user_name', 'user', 'task', 'notes', 'challenges', 'created_at')
        extra_kwargs = {'user': {'read_only': True}}
    
    def get_project_name(self, obj):
        return obj.project.name
    
    def get_user_name(self, obj):
        return obj.user.get_full_name()