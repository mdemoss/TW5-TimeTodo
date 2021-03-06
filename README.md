# TW5-TimeTodo
### A TiddlyWiki5 plugin for unscheduled, periodically recurring tasks.

The focus is in particular on is on those tasks that come due some amount of time after the task was last completed like: mowing the lawn, cleaning the gutters, changing filters, watering plants, and so on.

The plugin *does not* support the sort of recurring tasks that happen according to the calendar. Tasks like "send report once every week on Friday," and "make payment on the 15th of each month" are not supported.

The plugin provides two custom HTML elements that go into your tiddlers: `<to-do>` and `<to-do-list>`. Putting your `<to-do>` tags in a `<to-do-list>` is optional, it only makes it easier to add new items and specify expiration.

## Screen Shots

![Yard and kitchen tasks outside list](/doc/yard_and_kitchen.PNG)

![Shopping list inside list no recur specified](/doc/shopping_list.PNG)

## Details

### The `<to-do>` tag

The text content of the tag will be displayed as the title of the item.

The `recur` attribute of the tag specifies the time between when a task is marked as done and when it will appear as ready to do again. This is specified as a human-readable time string that [timestring](https://www.npmjs.com/package/timestring) can parse.

Valid time strings are: `'1 mon'`, `'2w'`, `'1.5d'`, `'1day 15h 20minutes 15s'`, `'1h 15m'`, and so on.

These keywords can be used:
1. `ms, milli, millisecond, milliseconds` - will parse to milliseconds
2. `s, sec, secs, second, seconds` - will parse to seconds
3. `m, min, mins, minute, minutes` - will parse to minutes
4. `h, hr, hrs, hour, hours` - will parse to hours
5. `d, day, days` - will parse to days
6. `w, week, weeks` - will parse to weeks
7. `mon, mth, mths, month, months` - will parse to months
8. `y, yr, yrs, year, years` - will parse to years

The `done` attribute indicates when the task was most recently done. This can be is any string that moment.js can parse. When a task is marked as done by clicking, ISO 8601 strings are used.

The `times-done` attribute this attribute keeps track of how many times a recurring task has been done. Updated automatically when a task is marked as done by clicking.

The `added` attribute is for internal use when a `to-do` tag is used inside a `to-do-list`. It is used to help uniquely identify items and to check whether the to-do-list should have focus after a refresh.

### The `<to-do-list>` tag

The `expires` attribute specifies how long completed non-recurring tasks should be visible within the list. This is specified as a human-readable time string that [timestring](https://www.npmjs.com/package/timestring) can parse, same as the `recur` attribute of the `to-do` tag. When this tag is present, a count of the expired items and a button to remove them all at once will appear at the bottom of the list.
