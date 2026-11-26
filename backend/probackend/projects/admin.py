from django.contrib import admin
from .models import Project, Taskactivities, Stakeholders, ProjectStaff

admin.site.register(Project)
admin.site.register(Stakeholders)
admin.site.register(Taskactivities)
admin.site.register(ProjectStaff)
