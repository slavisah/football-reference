# Content Model

## Common front matter

```yaml
title: string
slug: string
lastReviewed: YYYY-MM-DD
status: draft | review | verified | needs-detailed-audit
```

## Competition edition

```ts
type CompetitionEdition = {
  year: number | string;
  host: string[];
  teams?: number;
  winner: string;
  runnerUp?: string;
  third?: string;
  fourthOrOtherSemifinalist?: string;
  finalScore?: string;
  formatNote?: string;
  sourceRefs?: string[];
};
```

## Award edition

```ts
type AwardEdition = {
  year: number;
  winner: string;
  teamOrNationality: string;
  club?: string;
  value?: number;
  note?: string;
};
```

## Country identity

Do not use display names as permanent identifiers. Introduce stable slugs:

```yaml
id: west-germany
displayName: West Germany
summaryGroup: germany
historical: true
```

## Build-time validation

Validate:

- unique year/season per competition, except explicitly allowed cases such as the two 1959 South American Championships;
- required winner field;
- team count is positive;
- no duplicate table headers;
- source URLs are valid;
- `lastReviewed` is present.
