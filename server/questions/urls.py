from django.conf.urls import patterns, include, url

from . import views


urlpatterns = patterns(
    '',
    url(r'^groups/$', views.groups, name='groups'),
    url(r'^(?P<id>\d+)$', views.questions, name='questions'),
)
