from django.db import models
import uuid
from apps.organizations.models import Organization

class PackagePlan(models.Model):
    SERVICE_CHOICES = (
        ('HOTSPOT', 'Hotspot WiFi'),
        ('PPPOE', 'PPPoE Fiber / Wireless'),
        ('STATIC_IP', 'Dedicated Static IP'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='packages')
    name = models.CharField(max_length=128)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=12, decimal_places=2) # TZS
    duration_minutes = models.IntegerField()
    download_speed_kbps = models.IntegerField()
    upload_speed_kbps = models.IntegerField()
    data_limit_mb = models.BigIntegerField(default=0)
    validity_hours = models.IntegerField(default=24)
    device_limit = models.IntegerField(default=1)
    service_type = models.CharField(max_length=32, choices=SERVICE_CHOICES, default='HOTSPOT')
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'xcloud_packages'
        indexes = [
            models.Index(fields=['organization', 'active']),
        ]

    def __str__(self):
        return f"{self.name} (TZS {self.price})"
