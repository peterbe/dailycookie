import hashlib
import unicodedata
import datetime
import os
import random

from unidecode import unidecode

from django.db import models
from django.utils import timezone
from django.contrib.auth.models import User
from django.dispatch import receiver


class Locale(models.Model):
    code = models.CharField(max_length=30, unique=True)
    name = models.CharField(max_length=100, blank=True, null=True)

    def __unicode__(self):
        if self.name:
            return '%s (%s)' % (self.name, self.code)
        else:
            return self.code


class QuestionGroup(models.Model):
    name = models.CharField(max_length=200)
    locale = models.ForeignKey(Locale)
    created = models.DateTimeField(default=timezone.now)
    modified = models.DateTimeField(default=timezone.now)
    author = models.ForeignKey(User, null=True)

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
        _now = timezone.now()
        path = os.path.join(
            _now.strftime('%Y'),
            _now.strftime('%m'),
            _now.strftime('%d'),
        )
        hashed_filename = (
            hashlib.md5(
                filename + str(timezone.now().microsecond)
            ).hexdigest()
        )[:5]
        __, extension = os.path.splitext(filename)
        return os.path.join(tag, path, hashed_filename + extension)
    return _upload_path_tagged


def get_default_locale():
    for word in Word.objects.all().order_by('-created')[:1]:
        return word.locale
    return Locale.objects.get(code='sv')


def random_string():
    pool = 'abcdef1234567890'
    return ''.join(random.sample(list(pool), len(pool)))


class Word(models.Model):
    uuid = models.CharField(max_length=20)
    locale = models.ForeignKey(Locale, default=get_default_locale)
    word = models.CharField(max_length=200)
    mp3file = models.FileField(
        null=True,
        blank=True,
        upload_to=upload_path('words-mp3')
    )
    oggfile = models.FileField(
        null=True,
        blank=True,
        upload_to=upload_path('words-ogg')
    )
    explanation = models.TextField(null=True, blank=True)

    author = models.ForeignKey(User, null=True)
    created = models.DateTimeField(default=timezone.now)
    modified = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['word']
        unique_together = ['word', 'locale']

    def __unicode__(self):
        return self.word

    def __repr__(self):
        return '<%s: %s>' % (self.__class__.__name__, self.uuid)

    @classmethod
    def make_uuid(self, word):
        string = '%s-%s' % (word.locale.code, unidecode(word.word))
        string = '%s-%s' % (hashlib.md5(string).hexdigest()[:5], string)
        return string[:20]


@receiver(models.signals.pre_save, sender=Word)
def set_uuid(sender, instance, *args, **kwargs):
    if not instance.uuid:
        instance.uuid = Word.make_uuid(instance)


def get_default_group():
    for q in Question.objects.all().order_by('-created')[:1]:
        return q.group
    return None


class Question(models.Model):
    group = models.ForeignKey(QuestionGroup, default=get_default_group)
    picture = models.ImageField(
        null=True,
        blank=True,
        upload_to=upload_path('pictures')
    )
    question = models.TextField(null=True, blank=True)
    correct = models.ManyToManyField(Word, related_name='correct')
    incorrect = models.ManyToManyField(Word, related_name='incorrect', blank=True)

    author = models.ForeignKey(User, null=True)
    created = models.DateTimeField(default=timezone.now)
    modified = models.DateTimeField(default=timezone.now)


@receiver(models.signals.pre_save, sender=Word)
@receiver(models.signals.pre_save, sender=Question)
@receiver(models.signals.pre_save, sender=QuestionGroup)
def update_modified(sender, instance, raw, *args, **kwargs):
    if raw:
        return
    instance.modified = timezone.now()
