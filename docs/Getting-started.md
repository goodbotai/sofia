# Sofia
A survey bot for health


# Overview
What we have now is Sofia Version 1 based on DMC-II spec.
It's a series of Rapidpro flows.
The flows are in the [rapidpro.ona.io] Sofia organisation and start from the
Registration flow.

The channels of use are:
- Facebook Messenger
- Telegram
- SMS


# Metrics
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


# Differences between Version 1 and Version 2
Version 2 is just more questions on top of version 1.


# Languages
- English
- Indonesian



# Flows
Flows are in the following sequence:
### Version 1
- Regsitration: to register new parents/kids.
- Locomotor (section 5)
- Fine motor (section 6)
- Language (section 7)

### Version 2
- Regsitration: to register new parents/kids.
- Gross motor - this is the new name for Locomotor (section 5)
- Fine motor (section 6)
- Language (section 7)

For more look at the specific doc for Flows.

# Images
Why do we want to fetch the images from facebook and not a public place?

# Spec
Sofia version 2 is dependent on the DMC-III spec and uses rapidpro v2
Look in spec/ folder for the raw xlsx specs.


[rapidpro.ona.io]: https://rapidpro.ona.io
