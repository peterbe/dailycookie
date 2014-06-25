from django.conf.urls import patterns, include, url
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns('',
    # Examples:
    url(r'^questions/', include('server.questions.urls', namespace='questions')),
    url(r'^admin/', include(admin.site.urls)),
)

if settings.DEBUG:
    # urlpatterns += patterns('', url(r'^silk', include('silk.urls', namespace='silk')))
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT
    )
