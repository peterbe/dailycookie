"""
Django settings for server project.

For more information on this file, see
https://docs.djangoproject.com/en/1.6/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/1.6/ref/settings/
"""

# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
import os
BASE_DIR = os.path.dirname(os.path.dirname(__file__))


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/1.6/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'd7h^fb7ydqk)xm645m42ly7v8-z2i12jwuuu!h^7ye4n2wzv=e'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG_PROPAGATE_EXCEPTIONS = DEBUG = TEMPLATE_DEBUG = True

ALLOWED_HOSTS = []


# Application definition

INSTALLED_APPS = (
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'south',
    'sorl.thumbnail',
    'pipeline',
    'server.questions',
    'server.cms',
)

MIDDLEWARE_CLASSES = (
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
)

ROOT_URLCONF = 'server.urls'

WSGI_APPLICATION = 'server.wsgi.application'

MEDIA_URL = '/'

STATICFILES_STORAGE = 'pipeline.storage.PipelineCachedStorage'

# Use memcached for session storage
SESSION_ENGINE = 'django.contrib.sessions.backends.cached_db'

# Database
# https://docs.djangoproject.com/en/1.6/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.path.join(BASE_DIR, 'db.sqlite3'),
    }
}

# Internationalization
# https://docs.djangoproject.com/en/1.6/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_L10N = False

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/1.6/howto/static-files/

STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'static')

PIPELINE_CSS = {
    'cms': {
        'source_filenames': (
            'cms/bootstrap/css/bootstrap.min.css',
            'cms/dashboard.css',
            'cms/group.css',
        ),
        'output_filename': 'css/cms.css',
        #'extra_context': {
        #    'media': 'screen,projection',
        #},
    },
    'dropzone': {
        'source_filenames': (
            'cms/dropzone/css/dropzone.css',
        ),
        'output_filename': 'css/dropzone.css',
    }
}

PIPELINE_JS = {
    'cms': {
        'source_filenames': (
          'cms/jquery.min.js',
        #   'cms/bootstrap/js/bootstrap.min.js',
          'cms/angular/angular.min.js',
          'cms/angular/angular-route.min.js',
        #   'cms/angular-bootstrap/ui-bootstrap.min.js',
        #   'cms/angular-bootstrap/ui-bootstrap-tpls.min.js',
          'cms/angular-bootstrap/ui-bootstrap-tpls-0.11.2.min.js',
          'cms/app.js',
          'cms/controllers.js',
        ),
        'output_filename': 'js/cms.js',
    },
    'dropzone': {
        'source_filenames': (
            'cms/dropzone/dropzone.min.js',
        ),
        'output_filename': 'js/dropzone.js',
    }
}
