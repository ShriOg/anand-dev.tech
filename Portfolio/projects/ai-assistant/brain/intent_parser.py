import re
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from actions.schema import ActionType, Action, create_action


@dataclass
class ParsedIntent:
    action_type: ActionType
    entities: Dict[str, str]
    confidence: float
    raw_input: str


class IntentPattern:
    def __init__(self, patterns: List[str], action_type: ActionType, entity_extractors: Optional[Dict[str, str]] = None):
        self.patterns = [re.compile(p, re.IGNORECASE) for p in patterns]
        self.action_type = action_type
        self.entity_extractors = entity_extractors or {}

    def match(self, text: str) -> Optional[Tuple[float, Dict[str, str]]]:
        for pattern in self.patterns:
            match = pattern.search(text)
            if match:
                entities = {}
                for entity_name, group_name in self.entity_extractors.items():
                    try:
                        value = match.group(group_name)
                        if value:
                            entities[entity_name] = value.strip()
                    except (IndexError, KeyError):
                        pass
                confidence = 0.9 if match.group(0) == text.strip() else 0.7
                return confidence, entities
        return None


class IntentParser:
    def __init__(self):
        self.patterns: List[IntentPattern] = []
        self._register_default_patterns()

    def _register_default_patterns(self):
        self.patterns = [
            IntentPattern(
                patterns=[
                    r"^open\s+(?:app(?:lication)?|program)?\s*(?P<app>.+)$",
                    r"^launch\s+(?P<app>.+)$",
                    r"^start\s+(?P<app>.+)$",
                    r"^run\s+(?P<app>.+)$",
                ],
                action_type=ActionType.OPEN_APP,
                entity_extractors={"app_name": "app"}
            ),
            
            IntentPattern(
                patterns=[
                    r"^open\s+file\s+(?P<path>.+)$",
                    r"^open\s+(?P<path>(?:[a-zA-Z]:)?[\\/].+)$",
                    r"^open\s+(?P<path>~[\\/].+)$",
                ],
                action_type=ActionType.OPEN_FILE,
                entity_extractors={"path": "path"}
            ),
            
            IntentPattern(
                patterns=[
                    r"^open\s+folder\s+(?P<path>.+)$",
                    r"^open\s+directory\s+(?P<path>.+)$",
                    r"^show\s+folder\s+(?P<path>.+)$",
                ],
                action_type=ActionType.OPEN_FOLDER,
                entity_extractors={"path": "path"}
            ),
            
            IntentPattern(
                patterns=[
                    r"^(?:open\s+)?(?:url|website|site|link)\s+(?P<url>.+)$",
                    r"^go\s+to\s+(?P<url>(?:https?://)?[\w.-]+\.[a-z]{2,}.*)$",
                    r"^browse\s+(?P<url>.+)$",
                ],
                action_type=ActionType.OPEN_URL,
                entity_extractors={"url": "url"}
            ),
            
            IntentPattern(
                patterns=[
                    r"^(?:set\s+)?volume\s+(?:to\s+)?(?P<level>\d+)(?:%)?$",
                    r"^(?:adjust\s+)?volume\s+(?P<level>\d+)(?:%)?$",
                    r"^volume\s+(?P<level>\d+)(?:%)?$",
                ],
                action_type=ActionType.ADJUST_VOLUME,
                entity_extractors={"level": "level"}
            ),
            
            IntentPattern(
                patterns=[
                    r"^mute(?:\s+volume)?$",
                    r"^silence$",
                ],
                action_type=ActionType.MUTE_VOLUME,
                entity_extractors={}
            ),
            
            IntentPattern(
                patterns=[
                    r"^unmute(?:\s+volume)?$",
                    r"^un-mute(?:\s+volume)?$",
                ],
                action_type=ActionType.UNMUTE_VOLUME,
                entity_extractors={}
            ),
            
            IntentPattern(
                patterns=[
                    r"^(?:take\s+)?(?:a\s+)?screenshot$",
                    r"^capture\s+screen$",
                    r"^screenshot(?:\s+(?P<path>.+))?$",
                    r"^screen\s+capture$",
                ],
                action_type=ActionType.TAKE_SCREENSHOT,
                entity_extractors={"path": "path"}
            ),
            
            IntentPattern(
                patterns=[
                    r"^shutdown$",
                    r"^shut\s+down$",
                    r"^power\s+off$",
                    r"^turn\s+off(?:\s+computer)?$",
                ],
                action_type=ActionType.SHUTDOWN,
                entity_extractors={}
            ),
            
            IntentPattern(
                patterns=[
                    r"^restart$",
                    r"^reboot$",
                    r"^restart\s+computer$",
                ],
                action_type=ActionType.RESTART,
                entity_extractors={}
            ),
            
            IntentPattern(
                patterns=[
                    r"^lock(?:\s+screen)?$",
                    r"^lock\s+computer$",
                ],
                action_type=ActionType.LOCK_SCREEN,
                entity_extractors={}
            ),
            
            IntentPattern(
                patterns=[
                    r"^(?:what(?:'s|\s+is)\s+)?(?:the\s+)?time(?:\?)?$",
                    r"^current\s+time$",
                    r"^tell\s+(?:me\s+)?(?:the\s+)?time$",
                ],
                action_type=ActionType.GET_TIME,
                entity_extractors={}
            ),
            
            IntentPattern(
                patterns=[
                    r"^(?:what(?:'s|\s+is)\s+)?(?:the\s+)?date(?:\?)?$",
                    r"^(?:what(?:'s|\s+is)\s+)?today(?:'s)?\s+date(?:\?)?$",
                    r"^current\s+date$",
                ],
                action_type=ActionType.GET_DATE,
                entity_extractors={}
            ),
            
            IntentPattern(
                patterns=[
                    r"^(?:what(?:'s|\s+is)\s+)?(?:the\s+)?battery(?:\s+level|\s+status)?(?:\?)?$",
                    r"^battery$",
                    r"^check\s+battery$",
                ],
                action_type=ActionType.GET_BATTERY,
                entity_extractors={}
            ),
            
            IntentPattern(
                patterns=[
                    r"^help$",
                    r"^(?:show\s+)?commands$",
                    r"^what\s+can\s+you\s+do(?:\?)?$",
                ],
                action_type=ActionType.HELP,
                entity_extractors={}
            ),
            
            IntentPattern(
                patterns=[
                    r"^exit$",
                    r"^quit$",
                    r"^bye$",
                    r"^goodbye$",
                    r"^close$",
                ],
                action_type=ActionType.EXIT,
                entity_extractors={}
            ),
            
            IntentPattern(
                patterns=[
                    r"^(?:enable\s+)?safe\s+mode$",
                    r"^enter\s+safe\s+mode$",
                ],
                action_type=ActionType.ENABLE_SAFE_MODE,
                entity_extractors={}
            ),
            
            IntentPattern(
                patterns=[
                    r"^disable\s+safe\s+mode$",
                    r"^exit\s+safe\s+mode$",
                    r"^normal\s+mode$",
                ],
                action_type=ActionType.DISABLE_SAFE_MODE,
                entity_extractors={}
            ),
            
            IntentPattern(
                patterns=[
                    r"^status$",
                    r"^show\s+status$",
                    r"^assistant\s+status$",
                ],
                action_type=ActionType.STATUS,
                entity_extractors={}
            ),
        ]

    def parse(self, user_input: str) -> ParsedIntent:
        text = user_input.strip()
        
        if not text:
            return ParsedIntent(
                action_type=ActionType.UNKNOWN,
                entities={},
                confidence=0.0,
                raw_input=user_input
            )
        
        best_match = None
        best_confidence = 0.0
        best_entities = {}
        
        for pattern in self.patterns:
            result = pattern.match(text)
            if result:
                confidence, entities = result
                if confidence > best_confidence:
                    best_confidence = confidence
                    best_match = pattern.action_type
                    best_entities = entities
        
        if best_match:
            return ParsedIntent(
                action_type=best_match,
                entities=best_entities,
                confidence=best_confidence,
                raw_input=user_input
            )
        
        return ParsedIntent(
            action_type=ActionType.UNKNOWN,
            entities={},
            confidence=0.0,
            raw_input=user_input
        )

    def create_action_from_intent(self, intent: ParsedIntent) -> Action:
        if intent.action_type == ActionType.ADJUST_VOLUME:
            level = int(intent.entities.get("level", 50))
            return create_action(ActionType.ADJUST_VOLUME, level=level)
        
        return create_action(intent.action_type, **intent.entities)

    def add_pattern(self, pattern: IntentPattern):
        self.patterns.insert(0, pattern)
