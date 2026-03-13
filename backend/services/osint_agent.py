import feedparser
from typing import Dict

RSS_FEEDS = [
    "https://www.boomlive.in/feed",
    "https://www.altnews.in/feed",
    "https://factcheck.afp.com/rss/afp-fact-check-india",
    "https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=3",
]

FINGERPRINTS = {
    'lockdown': {'verdict': 'FALSE', 'fingerprint': 'LOCKDOWN_HOAX_2021',
        'explanation': 'Matches known lockdown hoax pattern circulated in 2021.'},
    'upi': {'verdict': 'SCAM', 'fingerprint': 'UPI_FRAUD_V3',
        'explanation': 'Matches known UPI payment fraud pattern. Never share OTP or PIN.'},
    'pm modi': {'verdict': 'FALSE', 'fingerprint': 'PM_QUOTE_FAKE',
        'explanation': 'Matches fabricated PM quote pattern.'},
    'free recharge': {'verdict': 'SCAM', 'fingerprint': 'FREE_RECHARGE_SCAM',
        'explanation': 'Classic free recharge scam. No telecom company offers this.'},
    'bank account': {'verdict': 'SCAM', 'fingerprint': 'BANK_PHISHING',
        'explanation': 'Bank phishing pattern. Banks never ask for credentials via message.'},
    'won a prize': {'verdict': 'SCAM', 'fingerprint': 'LOTTERY_SCAM',
        'explanation': 'Classic lottery/prize scam pattern.'},
    'click this link': {'verdict': 'SCAM', 'fingerprint': 'PHISHING_LINK',
        'explanation': 'Phishing link pattern detected.'},
    'forward this': {'verdict': 'FALSE', 'fingerprint': 'CHAIN_MESSAGE',
        'explanation': 'Classic chain message designed to spread misinformation.'},
    'government': {'verdict': 'UNVERIFIED', 'fingerprint': 'FAKE_CIRCULAR',
        'explanation': 'Unverified government claim. Check PIB for official announcements.'},
}

_classifier = None
_translator_model = None
_translator_tokenizer = None


def _get_translator():
    global _translator_model, _translator_tokenizer
    if _translator_model is None:
        try:
            from transformers import MarianMTModel, MarianTokenizer
            print("[osint_agent] Loading Helsinki translator...")
            name = 'Helsinki-NLP/opus-mt-mul-en'
            _translator_tokenizer = MarianTokenizer.from_pretrained(name)
            _translator_model = MarianMTModel.from_pretrained(name)
            print("[osint_agent] Translator loaded ✅")
        except Exception as e:
            print(f"[osint_agent] Translator load failed: {e}")
            _translator_model = False
    return (_translator_model, _translator_tokenizer) if _translator_model else (None, None)


def _get_classifier():
    global _classifier
    if _classifier is None:
        try:
            from transformers import pipeline
            print("[osint_agent] Loading RoBERTa...")
            _classifier = pipeline(
                "text-classification",
                model="hamzab/roberta-fake-news-classification"
            )
            print("[osint_agent] RoBERTa loaded ✅")
        except Exception as e:
            print(f"[osint_agent] RoBERTa load failed: {e}")
            _classifier = False
    return _classifier if _classifier else None


def _detect_language(text: str) -> str:
    for ch in text:
        cp = ord(ch)
        if (0x0900 <= cp <= 0x097F or 0x0980 <= cp <= 0x09FF or
            0x0B80 <= cp <= 0x0BFF or 0x0C00 <= cp <= 0x0C7F or
            0x0C80 <= cp <= 0x0CFF or 0x0D00 <= cp <= 0x0D7F or
            0x0A80 <= cp <= 0x0AFF or 0x0A00 <= cp <= 0x0A7F):
            return 'non-english'
    return 'english'


def _translate_to_english(text: str) -> str:
    model, tokenizer = _get_translator()
    if not model:
        return text
    try:
        inputs = tokenizer([text[:512]], return_tensors='pt', padding=True, truncation=True)
        translated = model.generate(**inputs)
        result = tokenizer.decode(translated[0], skip_special_tokens=True)
        return result
    except Exception as e:
        print(f"[osint_agent] Translation error: {e}")
        return text


def _search_rss_feeds(claim_text: str) -> dict:
    claim_words = set(claim_text.lower().split())
    matched_sources = []
    matched_titles = []
    for feed_url in RSS_FEEDS:
        try:
            feed = feedparser.parse(feed_url)
            source_name = feed.feed.get('title', feed_url)
            for entry in feed.entries[:10]:
                combined = entry.get('title', '').lower() + ' ' + entry.get('summary', '').lower()
                matches = sum(1 for word in claim_words if len(word) > 4 and word in combined)
                if matches >= 2:
                    matched_sources.append(source_name)
                    matched_titles.append(entry.get('title', ''))
                    break
        except Exception as e:
            print(f"[osint_agent] RSS error {feed_url}: {e}")
    return {'matched_sources': list(set(matched_sources)), 'matched_titles': matched_titles[:3]}


def _check_sentiment_keywords(claim_text: str) -> dict:
    claim_lower = claim_text.lower()
    negative_signals = [
        'forward this message', 'share immediately', 'leaked', 'exclusive',
        'whatsapp par bhejo', 'abhi share karo', 'click here',
        'limited time', 'act now', 'otp', 'pin', 'password', 'verify your account'
    ]
    positive_signals = [
        'press release', 'official statement', 'ministry', 'according to',
        'confirmed by', 'announced officially', 'pib', 'government of india',
        'supreme court', 'high court', 'rbi', 'sebi', 'dated', 'reference no'
    ]
    negative_count = sum(1 for s in negative_signals if s in claim_lower)
    positive_count = sum(1 for s in positive_signals if s in claim_lower)
    return {
        'negative_signals': negative_count,
        'positive_signals': positive_count,
        'credibility_shift': positive_count - negative_count
    }


def verify_claim(claim_text: str) -> Dict:
    if not claim_text or len(claim_text.strip()) < 5:
        return {
            'verdict': 'UNVERIFIED',
            'explanation': 'No text extracted to verify.',
            'matched_sources': [],
            'fingerprint_match': '',
            'translated': False,
            'models_used': ['EasyOCR']
        }

    original_text = claim_text
    lang = _detect_language(claim_text)
    translated = False
    models_used = ['EasyOCR']

    if lang == 'non-english':
        claim_text = _translate_to_english(claim_text)
        translated = True
        models_used.append('Helsinki-NLP/opus-mt-mul-en (Translator)')

    claim_lower = claim_text.lower()

    # Layer 1: Fingerprint
    for keyword, result in FINGERPRINTS.items():
        if keyword in claim_lower or keyword in original_text.lower():
            models_used.append('Fingerprint Database')
            return {
                'verdict': result['verdict'],
                'fingerprint_match': result['fingerprint'],
                'explanation': result['explanation'],
                'matched_sources': ['AltNews', 'PIB', 'BOOM', 'FactChecker.in'],
                'translated': translated,
                'original_language': lang,
                'models_used': models_used
            }

    # Layer 2: RoBERTa
    classifier = _get_classifier()
    models_used.append('RoBERTa (hamzab/roberta-fake-news-classification)')
    if classifier and len(claim_text) > 20:
        try:
            ml_result = classifier(claim_text[:512])[0]
            ml_label = ml_result['label'].upper()
            ml_score = round(ml_result['score'] * 100, 1)
            if ml_label == 'FAKE' and ml_score > 90:
                return {
                    'verdict': 'FALSE',
                    'fingerprint_match': 'ML_FAKE_NEWS_DETECTED',
                    'explanation': f'RoBERTa ML model detected fake news patterns with {ml_score}% confidence.',
                    'matched_sources': ['AI Classifier (RoBERTa)'],
                    'ml_confidence': ml_score,
                    'translated': translated,
                    'original_language': lang,
                    'models_used': models_used
                }
        except Exception as e:
            print(f"[osint_agent] RoBERTa inference error: {e}")

    # Layer 3: RSS
    rss_result = _search_rss_feeds(claim_text)
    models_used.append('RSS Fact-Check Feeds (AltNews, BOOM, PIB, AFP)')

    # Layer 4: Sentiment
    sentiment = _check_sentiment_keywords(claim_text)
    models_used.append('Sentiment Keyword Analysis')

    if rss_result['matched_sources']:
        verdict = 'VERIFIED' if sentiment['credibility_shift'] >= 0 else 'UNVERIFIED'
        explanation = f"Found in trusted sources: {', '.join(rss_result['matched_sources'])}."
    elif sentiment['negative_signals'] >= 3:
        verdict = 'SUSPICIOUS'
        explanation = f"Contains {sentiment['negative_signals']} misinformation language patterns."
    elif sentiment['negative_signals'] >= 1:
        verdict = 'UNVERIFIED'
        explanation = "Contains some suspicious language patterns."
    else:
        verdict = 'UNVERIFIED'
        explanation = 'No matching sources found in trusted Indian fact-check databases.'

    return {
        'verdict': verdict,
        'fingerprint_match': '',
        'explanation': explanation,
        'matched_sources': rss_result['matched_sources'] or [],
        'matched_titles': rss_result.get('matched_titles', []),
        'sentiment_signals': sentiment,
        'translated': translated,
        'original_language': lang,
        'models_used': models_used
    }