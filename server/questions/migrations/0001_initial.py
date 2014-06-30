# -*- coding: utf-8 -*-
from south.utils import datetime_utils as datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding model 'Locale'
        db.create_table(u'questions_locale', (
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('code', self.gf('django.db.models.fields.CharField')(unique=True, max_length=30)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=100, null=True, blank=True)),
        ))
        db.send_create_signal(u'questions', ['Locale'])

        # Adding model 'QuestionGroup'
        db.create_table(u'questions_questiongroup', (
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=200)),
            ('locale', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['questions.Locale'])),
            ('created', self.gf('django.db.models.fields.DateTimeField')(default=datetime.datetime(2014, 6, 30, 0, 0))),
            ('modified', self.gf('django.db.models.fields.DateTimeField')(default=datetime.datetime(2014, 6, 30, 0, 0))),
        ))
        db.send_create_signal(u'questions', ['QuestionGroup'])

        # Adding model 'Word'
        db.create_table(u'questions_word', (
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('uuid', self.gf('django.db.models.fields.CharField')(max_length=20)),
            ('locale', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['questions.Locale'])),
            ('word', self.gf('django.db.models.fields.CharField')(max_length=200)),
            ('mp3file', self.gf('django.db.models.fields.files.FileField')(max_length=100, null=True, blank=True)),
            ('oggfile', self.gf('django.db.models.fields.files.FileField')(max_length=100, null=True, blank=True)),
            ('explanation', self.gf('django.db.models.fields.TextField')(null=True, blank=True)),
            ('created', self.gf('django.db.models.fields.DateTimeField')(default=datetime.datetime(2014, 6, 30, 0, 0))),
            ('modified', self.gf('django.db.models.fields.DateTimeField')(default=datetime.datetime(2014, 6, 30, 0, 0))),
        ))
        db.send_create_signal(u'questions', ['Word'])

        # Adding model 'Question'
        db.create_table(u'questions_question', (
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('group', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['questions.QuestionGroup'])),
            ('picture', self.gf('django.db.models.fields.files.ImageField')(max_length=100, null=True, blank=True)),
            ('question', self.gf('django.db.models.fields.TextField')(null=True, blank=True)),
            ('created', self.gf('django.db.models.fields.DateTimeField')(default=datetime.datetime(2014, 6, 30, 0, 0))),
            ('modified', self.gf('django.db.models.fields.DateTimeField')(default=datetime.datetime(2014, 6, 30, 0, 0))),
        ))
        db.send_create_signal(u'questions', ['Question'])

        # Adding M2M table for field correct on 'Question'
        m2m_table_name = db.shorten_name(u'questions_question_correct')
        db.create_table(m2m_table_name, (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('question', models.ForeignKey(orm[u'questions.question'], null=False)),
            ('word', models.ForeignKey(orm[u'questions.word'], null=False))
        ))
        db.create_unique(m2m_table_name, ['question_id', 'word_id'])

        # Adding M2M table for field incorrect on 'Question'
        m2m_table_name = db.shorten_name(u'questions_question_incorrect')
        db.create_table(m2m_table_name, (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('question', models.ForeignKey(orm[u'questions.question'], null=False)),
            ('word', models.ForeignKey(orm[u'questions.word'], null=False))
        ))
        db.create_unique(m2m_table_name, ['question_id', 'word_id'])


    def backwards(self, orm):
        # Deleting model 'Locale'
        db.delete_table(u'questions_locale')

        # Deleting model 'QuestionGroup'
        db.delete_table(u'questions_questiongroup')

        # Deleting model 'Word'
        db.delete_table(u'questions_word')

        # Deleting model 'Question'
        db.delete_table(u'questions_question')

        # Removing M2M table for field correct on 'Question'
        db.delete_table(db.shorten_name(u'questions_question_correct'))

        # Removing M2M table for field incorrect on 'Question'
        db.delete_table(db.shorten_name(u'questions_question_incorrect'))


    models = {
        u'questions.locale': {
            'Meta': {'object_name': 'Locale'},
            'code': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '30'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '100', 'null': 'True', 'blank': 'True'})
        },
        u'questions.question': {
            'Meta': {'object_name': 'Question'},
            'correct': ('django.db.models.fields.related.ManyToManyField', [], {'related_name': "'correct'", 'symmetrical': 'False', 'to': u"orm['questions.Word']"}),
            'created': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime(2014, 6, 30, 0, 0)'}),
            'group': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['questions.QuestionGroup']"}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'incorrect': ('django.db.models.fields.related.ManyToManyField', [], {'symmetrical': 'False', 'related_name': "'incorrect'", 'blank': 'True', 'to': u"orm['questions.Word']"}),
            'modified': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime(2014, 6, 30, 0, 0)'}),
            'picture': ('django.db.models.fields.files.ImageField', [], {'max_length': '100', 'null': 'True', 'blank': 'True'}),
            'question': ('django.db.models.fields.TextField', [], {'null': 'True', 'blank': 'True'})
        },
        u'questions.questiongroup': {
            'Meta': {'object_name': 'QuestionGroup'},
            'created': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime(2014, 6, 30, 0, 0)'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'locale': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['questions.Locale']"}),
            'modified': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime(2014, 6, 30, 0, 0)'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '200'})
        },
        u'questions.word': {
            'Meta': {'ordering': "['word']", 'object_name': 'Word'},
            'created': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime(2014, 6, 30, 0, 0)'}),
            'explanation': ('django.db.models.fields.TextField', [], {'null': 'True', 'blank': 'True'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'locale': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['questions.Locale']"}),
            'modified': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime(2014, 6, 30, 0, 0)'}),
            'mp3file': ('django.db.models.fields.files.FileField', [], {'max_length': '100', 'null': 'True', 'blank': 'True'}),
            'oggfile': ('django.db.models.fields.files.FileField', [], {'max_length': '100', 'null': 'True', 'blank': 'True'}),
            'uuid': ('django.db.models.fields.CharField', [], {'max_length': '20'}),
            'word': ('django.db.models.fields.CharField', [], {'max_length': '200'})
        }
    }

    complete_apps = ['questions']