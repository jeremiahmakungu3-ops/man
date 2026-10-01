from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.accounts.urls')),
    path('api/organizations/', include('apps.organizations.urls')),
    path('api/routers/', include('apps.routers.urls')),
    path('api/packages/', include('apps.packages.urls')),
    path('api/vouchers/', include('apps.vouchers.urls')),
    path('api/customers/', include('apps.customers.urls')),
    path('api/payments/', include('apps.payments.urls')),
    path('api/sessions/', include('apps.sessions.urls')),
    path('api/agents/', include('apps.agents.urls')),
    path('api/monitoring/', include('apps.monitoring.urls')),
    path('api/reports/', include('apps.reports.urls')),
]
