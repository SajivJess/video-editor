import importlib.util
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location('transcribe', Path(__file__).resolve().parents[1] / 'scripts/transcribe.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class TransliterationTests(unittest.TestCase):
    def test_tamil_graphemes_and_english_code_switching(self):
        self.assertEqual(module.romanize('தமிழ்'), 'thamizh')
        self.assertEqual(module.romanize('வணக்கம்'), 'vanakkam')
        self.assertEqual(module.romanize('NVIDIAவை AI 1993'), 'NVIDIAvai AI 1993')

    def test_punctuation_is_preserved(self):
        self.assertEqual(module.romanize('AI, ChatGPT!'), 'AI, ChatGPT!')

if __name__ == '__main__':
    unittest.main()
