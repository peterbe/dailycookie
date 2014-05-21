import hashlib
import unicodedata
import datetime
import os

from django.db import models
from django.utils.timezone import utc
from jsonfield import JSONField


def now():
    return datetime.datetime.utcnow().replace(tzinfo=utc)



class QuestionGroup(models.Model):
    name = models.CharField(max_length=200)
    locale = models.CharField(max_length=30)
    created = models.DateTimeField(default=now)

    def __unicode__(self):
        return self.name


def upload_path(tag):
    def _upload_path_tagged(instance, filename):
        if isinstance(filename, unicode):
            filename = (
                unicodedata
                .normalize('NFD', filename)
                .encode('ascii', 'ignore')
            )
        _now = now()
        path = os.path.join(
            _now.strftime('%Y'),
            _now.strftime('%m'),
            _now.strftime('%d')
        )
        hashed_filename = (hashlib.md5(filename +
                           str(now().microsecond)).hexdigest())
        __, extension = os.path.splitext(filename)
        return os.path.join(tag, path, hashed_filename + extension)
    return _upload_path_tagged


class Question(models.Model):
    group = models.ForeignKey(QuestionGroup)
    picture = models.ImageField(null=True, blank=True, upload_to=upload_path('pictures'))
    question = models.TextField(null=True, blank=True)
    correct = JSONField()
    incorrect = JSONField()
    created = models.DateTimeField(default=now)
