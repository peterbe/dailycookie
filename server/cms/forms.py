from django import forms

from server.questions.models import Question


class UploadForm(forms.ModelForm):

    class Meta:
        model = Question
        fields = ('picture',)
