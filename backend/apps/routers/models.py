from django.db import models
import uuid
from apps.organizations.models import Organization, Site

class Router(models.Model):
    VENDOR_CHOICES = (
        ('MIKROTIK', 'MikroTik RouterOS'),
        ('OMADA', 'TP-Link Omada SDN'),
    )

    STATUS_CHOICES = (
        ('ONLINE', 'Online'),
        ('OFFLINE', 'Offline'),
        ('DEGRADED', 'Degraded'),
        ('CONFIGURING', 'Configuring'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='routers')
    site = models.ForeignKey(Site, on_delete=models.CASCADE, related_name='routers')
    name = models.CharField(max_length=255)
    vendor = models.CharField(max_length=32, choices=VENDOR_CHOICES, default='MIKROTIK')
    model = models.CharField(max_length=128, default='CCR2004')
    serial_number = models.CharField(max_length=128, blank=True)
    ip_address = models.GenericIPAddressField()
    management_port = models.IntegerField(default=8728)
    username = models.CharField(max_length=64, default='xcloud_api')
    credential_reference = models.CharField(max_length=255, blank=True)
    router_id = models.CharField(max_length=64, unique=True) # e.g. XC-DAR-001
    installation_token = models.CharField(max_length=128, blank=True, null=True)
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default='CONFIGURING')
    last_seen = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'xcloud_routers'
        indexes = [
            models.Index(fields=['organization', 'status']),
            models.Index(fields=['router_id']),
            models.Index(fields=['last_seen']),
        ]

    def __str__(self):
        return f"{self.name} [{self.router_id}]"
