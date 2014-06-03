import hashlib
import time
import random
from optparse import make_option
from StringIO import StringIO

from django.db.models import Q
from django.core.management.base import BaseCommand, CommandError
from django.core.files import File
from django.core.files.temp import NamedTemporaryFile

from server.questions.models import Word
from server.download import download_mp3


def fuzz_number(n):
    frac = n / 5  # 20%
    return n + random.randint(-frac, frac)


class Command(BaseCommand):

    option_list = BaseCommand.option_list + (
        make_option('--batchsize',
            # action='store_int',
            default=10,
            help='How many to download this time'),
        make_option('--sleeptime',
            # action='store_int',
            default=10,
            help='How long to sleep in between'),

        )

    help = 'Downloads MP3 files for specific words'

    def handle(self, *args, **options):
        no_mp3file = Q(mp3file__isnull=True) | Q(mp3file='')
        words = Word.objects.filter(no_mp3file)
        words = words.order_by('?')
        batchsize = int(options['batchsize'])
        sleeptime = int(options['sleeptime'])
        for word in words[:batchsize]:
            print repr(word.word), repr(word.locale.code)
            content = download_mp3(
                word.word,
                word.locale.code
            )
            print "\tDownloaded", len(content), "bytes"
            filename = '%s:%s' % (word.word, word.locale.code)
            filename = hashlib.md5(filename.encode('utf-8')).hexdigest()
            filename = filename[:6]
            filename += '.mp3'
            print "\tFilename", filename
            # print repr(content)
            temp = NamedTemporaryFile(delete=True)
            temp.write(content)
            temp.flush()
            word.mp3file.save(filename, File(temp))
            word.save()
            # print dir(word.mp3file)
            # print word.mp3file
            print "\tSaved", word.mp3file
            # print word.mp3file.size

            time.sleep(fuzz_number(sleeptime))
