# TW5-TimeTodo
### A TiddlyWiki5 plugin for unscheduled, periodically recurring tasks.

The focus is in particular on is on those tasks that come due some amount of time after the task was last completed like: mowing the lawn, cleaning the gutters, changing filters, watering plants, and so on.

The plugin *does not* support the sort of recurring tasks that happen according to the calendar. Tasks like "send report once every week on Friday," and "make payment on the 15th of each month" are not supported.

The plugin provides two custom HTML elements that go into your tiddlers: `<to-do>` and `<to-do-list>`. Putting your `<to-do>` tags in a `<to-do-list>` is optional, it only makes it easier to add new items and specify expiration.

## Examples

![Yard and kitchen tasks outside list](/doc/yard_and_kitchen.PNG)

![Shopping list inside list no recur specified](/doc/shopping_list.PNG)
