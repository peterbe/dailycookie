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
    list_display = ('picture_', 'correct_',)
    exclude = ('created', 'modified')
    form = QuestionAdminForm

    def correct_(self, obj):
        words = [x.word for x in obj.correct.all()]
        return ', '.join(words) + ' (%d)' % len(words)

    # def incorrect_(self, obj):
    #     words = [x.word for x in obj.incorrect.all()]
    #     return ', '.join(words) + ' (%d)' % len(words)

    def picture_(self, obj):
        if obj.picture:
            thumb = get_thumbnail(obj.picture, '64x64')
            return '<img src="%s">' % (thumb.url,)
        else:
            return 'missing'
    picture_.allow_tags = True


class QuestionGroupAdmin(admin.ModelAdmin):
    exclude = ('created', 'modified')
    list_display = ('name', 'locale', 'pictures_', 'correct_words_',)

    def pictures_(self, obj):
        return Question.objects.filter(group=obj).count()

    def correct_words_(self, obj):
        c = 0
        for q in Question.objects.filter(group=obj):
            c += q.correct.all().count()
        return c

    # def incorrect_words_(self, obj):
    #     c = 0
    #     for q in Question.objects.filter(group=obj):
    #         c += q.incorrect.all().count()
    #     return c


class LocaleAdmin(admin.ModelAdmin):
    list_display = ('code', 'name')


class WordAdmin(admin.ModelAdmin):
    list_display = ('word', 'uuid', 'explanation', 'mp3file_', 'question_')
    exclude = ('uuid', 'created', 'modified')
    search_fields = ['word']

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

    def question_(self, obj):
        # WARNING! This is looped for each item
        html = []
        for thing in Question.correct.through.objects.filter(word=obj):
            q = thing.question
            thumb = get_thumbnail(q.picture, '16x16')
            html.append(
                '<a href="%s"><img src="%s" alt="%s"></a>'
                % (
                    '/admin/questions/question/%s/' % q.id,
                    thumb.url,
                    obj.word
                )
            )
        return ''.join(html)
    question_.allow_tags = True


admin.site.register(Question, QuestionAdmin)
admin.site.register(QuestionGroup, QuestionGroupAdmin)
admin.site.register(Locale, LocaleAdmin)
admin.site.register(Word, WordAdmin)
