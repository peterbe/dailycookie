from django import forms
from django.contrib import admin
from django.conf import settings

from sorl.thumbnail import get_thumbnail

from .models import Locale, Question, QuestionGroup, Word


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
        # widgets = {
        #     'incorrect': ArrayInput,
        #     'correct': ArrayInput,
        # }


class QuestionAdmin(admin.ModelAdmin):
    list_display = ('picture_', 'correct_', 'incorrect_')
    exclude = ('created', 'modified')
    form = QuestionAdminForm

    def correct_(self, obj):
        return ', '.join(x.word for x in obj.correct.all())

    def incorrect_(self, obj):
        return ', '.join(x.word for x in obj.incorrect.all())

    def picture_(self, obj):
        thumb = get_thumbnail(obj.picture, '64x64')
        return '<img src="%s">' % (thumb.url,)
    picture_.allow_tags = True


class QuestionGroupAdmin(admin.ModelAdmin):
    exclude = ('created', 'modified')
    list_display = ('name', 'locale')


class LocaleAdmin(admin.ModelAdmin):
    list_display = ('code', 'name')


class WordAdmin(admin.ModelAdmin):
    list_display = ('word', 'explanation', 'mp3file_')
    exclude = ('created', 'modified')

    def mp3file_(self, obj):
        if obj.mp3file:
            html = '<audio id="audio-%s" src="%s"></audio>' % (
                obj.id,
                obj.mp3file.url,
            )
            html += (
                '<a href="#" onclick="document.getElementById(\'audio-%s\')'
                '.play();return false">play</a>'
                % obj.id
            )
            return html
        return ''
    mp3file_.allow_tags = True


admin.site.register(Question, QuestionAdmin)
admin.site.register(QuestionGroup, QuestionGroupAdmin)
admin.site.register(Locale, LocaleAdmin)
admin.site.register(Word, WordAdmin)
