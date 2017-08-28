# Sofia
A bot to track and access ECD progress.

### Version 1
Based on DMC-II spec. It's a series of Rapidpro flows.
The flows are in the [rapidpro.ona.io] Sofia organisation and start from the
Registration flow.

Channels:
- Facebook Messenger
- Telegram
- SMS

### Version 2
Based on DMC-III spec. It's a series of borq/botkit conversations.

Channels:
- Facebook Messenger

## Metrics
Metrics are based on questions, items and subscales.

An `item` is made up of two questions. Each question has a maximum age and
a minimum age. This means that if the child doesn't lie in this bracket we skip
asking the question entirely.

The `score` for each item is the sum of the two questions for that item:
Each question carries one (1) point.
  - Can the child do the skill?
  - Has the child been able to do this continually during the past month?

A survey is broken into different sections, these sections are called subscales.
The subscale score = sum of points in each subscale.
The subscales are:
- gross motor
- fine motor
- language

```bash
subscale_score = gross motor + fine motor + language
```

The start point for each subscale is based on the child's age.

If the child scores 0, go to the previous start point.
If the child scores 1 or 2, continue to the next item.
Stop after 4 consecutive scores of 0 and go to the appropriate start point for
the next subscale.


## Differences between Version 1 and Version 2
Version 2 is just more questions on top of version 1.


## Languages
- English
- Bahasa


## Documentation
 * [Spec](docs/Install.md)
 * [Flows](docs/Persistence.md)


## Images
Why do we want to fetch the images from facebook and not a public place?

[rapidpro.ona.io]: https://rapidpro.ona.io
