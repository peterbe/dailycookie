from django import forms
from django.contrib import admin
from django.conf import settings

from sorl.thumbnail import get_thumbnail

from .models import Question, QuestionGroup


class ArrayInput(forms.widgets.Textarea):

    def render(self, name, value, attrs=None):
        if isinstance(value, list):
            value = '\n'.join(value)
        return super(ArrayInput, self).render(name, value, attrs=attrs)

    def value_from_datadict(self, data, files, name):
        value = data.get(name, None)
        if isinstance(value, basestring):
            return [x.strip() for x in value.splitlines() if x.strip()]
        raise Exception(value)


class QuestionAdminForm(forms.ModelForm):

    class Meta:
        model = Question
        widgets = {
            'incorrect': ArrayInput,
            'correct': ArrayInput,
        }


class QuestionAdmin(admin.ModelAdmin):
    list_display = ('picture_', 'correct_', 'incorrect_')
    exclude = ('created',)
    form = QuestionAdminForm

    def correct_(self, obj):
        return ', '.join(obj.correct)

    def incorrect_(self, obj):
        return ', '.join(obj.incorrect)

    def picture_(self, obj):
        thumb = get_thumbnail(obj.picture, '64x64')
        return '<img src="%s">' % (thumb.url,)
    picture_.allow_tags = True


class QuestionGroupAdmin(admin.ModelAdmin):
    exclude = ('created',)


admin.site.register(Question, QuestionAdmin)
admin.site.register(QuestionGroup, QuestionGroupAdmin)
