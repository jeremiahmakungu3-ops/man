from django.db import models
import uuid

class Organization(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    contact_email = models.EmailField()
    contact_phone = models.CharField(max_length=32)
    country = models.CharField(max_length=64, default='Tanzania')
    currency = models.CharField(max_length=10, default='TZS')
    timezone = models.CharField(max_length=64, default='Africa/Dar_es_Salaam')
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'xcloud_organizations'
        indexes = [
            models.Index(fields=['slug']),
        ]

    def __str__(self):
        return self.name

class Site(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='sites')
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=32)
    city = models.CharField(max_length=128, default='Dar es Salaam')
    address = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'xcloud_sites'
        unique_together = ('organization', 'code')

    def __str__(self):
        return f"{self.name} ({self.code})"
