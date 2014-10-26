from django.conf.urls import patterns, include, url

from . import views


urlpatterns = patterns(
    '',
    url(r'partials/(?P<template>[\w\.]+)$', views.partial, name='partial'),

    url(r'groups/(?P<group_id>\d+)$', views.group, name='group'),

    url(r'groups/(?P<group_id>\d+)/questions$', views.group_questions,
        name='group_questions'),

    url(r'(?P<group_id>\d+)/upload$', views.upload, name='upload'),

    url(r'', views.home, name='home'),

)
