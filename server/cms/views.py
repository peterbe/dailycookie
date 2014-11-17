import os
import functools
import time
import stat
from collections import defaultdict

from django.db.utils import IntegrityError
from django.contrib.sites.models import RequestSite
from django.core.urlresolvers import reverse
from django.shortcuts import render, get_object_or_404
from django.template.loader import TemplateDoesNotExist
from django import http
from django.views.decorators.http import require_POST
from django.contrib.auth.decorators import login_required
from django.db import transaction

from jsonview.decorators import json_view

from server.questions.models import Question, QuestionGroup, Word
from server.questions.views import thumbnail
from . import forms

def add_CORS_header(f):
    @functools.wraps(f)
    def wrapper(request, *args, **kw):
        response = f(request, *args, **kw)
        response['Access-Control-Allow-Origin'] = '*'
        return response
    return wrapper


@login_required
def home(request):
    if 'text/html' not in request.META.get('HTTP_ACCEPT'):
        # an angular AJAX request gone rogue
        raise http.Http404()

    return render(request, 'cms/home.html')


def partial(request, template):
    try:
        return render(request, 'cms/partials/%s' % template)
    except TemplateDoesNotExist:
        raise http.Http404()


@login_required
@json_view
def group(request, group_id):
    group = get_object_or_404(QuestionGroup, id=group_id)
    return {
        'id': group.id,
        'name': group.name,
        'locale': {
            'name': group.locale.name,
            'code': group.locale.code
        },
    }


@login_required
@json_view
def group_questions(request, group_id):
    group = get_object_or_404(QuestionGroup, id=group_id)
    geometry = request.GET.get('geometry', '200x200')
    qs = Question.objects.filter(group=group).select_related('author')
    questions = []
    for question in qs:
        words = []
        thumb = thumbnail(question.picture, geometry, crop='center')
        for word in question.correct.all().select_related('author'):
            words.append(serialize_word(word))
        questions.append({
            'thumbnail': {
                'url': thumb.url,
                'width': thumb.width,
                'height': thumb.height
            },
            'id': question.id,
            'words': words,
            'author': question.author.username,
            'created': question.created.isoformat(),
            'modified': question.modified.isoformat(),
        })
    return {'questions': questions}


def serialize_word(word):
    return {
        'id': word.id,
        'word': word.word,
        'mp3file': word.mp3file and word.mp3file.url or None,
        'explanation': word.explanation,
        'author': word.author.username,
        'created': word.created.isoformat(),
        'modified': word.modified.isoformat(),
    }

@transaction.commit_on_success
@login_required
@json_view
def question(request, question_id):
    question = get_object_or_404(Question, id=question_id)

    if request.method == 'POST':
        if request.POST.get('remove'):
            word = request.POST['remove']
            word_obj = Word.objects.get(
                word__iexact=word,
                locale=question.group.locale,
            )
            question.correct.remove(word_obj)
            # Now, is anybody using this word?
            if not Question.correct.through.objects.filter(
                word=word_obj
            ):
                # nobody's using the word
                word_obj.delete()
            return True

        word = request.POST['word']
        assert word
        explanation = request.POST['explanation']
        locale = question.group.locale
        matches = Word.objects.filter(
            locale=locale,
            word__iexact=word
        )
        if matches:
            word_obj, = matches
            created = False
        else:
            word_obj = Word.objects.create(
                locale=locale,
                word=word,
                author=request.user
            )
        if explanation and word_obj.explanation != explanation:
            word_obj.explanation = explanation
            word_obj.save()

        question.correct.add(word_obj)

        return {'word': serialize_word(word_obj)}

    geometry = request.GET.get('geometry', '300x300')
    crop = request.GET.get('crop', 'center')
    words = []
    thumb = thumbnail(question.picture, geometry, crop='center')
    for word in question.correct.all().select_related('author'):
        words.append(serialize_word(word))
    question = {
        'id': question.id,
        'thumbnail': {
            'url': thumb.url,
            'width': thumb.width,
            'height': thumb.height
        },
        'words': words,
        'author': question.author.username,
        'created': question.created.isoformat(),
        'modified': question.modified.isoformat(),
    }
    return {'question': question}


@login_required
@require_POST
@json_view
def upload(request, group_id):
    group = get_object_or_404(QuestionGroup, id=group_id)
    form = forms.UploadForm(request.POST, request.FILES)
    if not form.is_valid():
        raise BadRequest # XXX

    question = form.save(commit=False)
    question.group = group
    question.author = request.user
    question.save()

    return {'question': {'id': question.id}}
    # raise NotImplementedError(group)


@login_required
@json_view
def csrf_token(request):
    return {'csrf_token': request.META["CSRF_COOKIE"]}
