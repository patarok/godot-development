OK i feel we are at least somewhere now, but there are remaining problems.

AFAICS:
Main Assignee
Assigned Users
Assigned Project
Tags

all are projected as string and if used as input it is abstracted from the strings we put in those fields just separated by a comma.

now think about how we would go about NOT using string, but instead, actually using the ID's as input and draw in all users we can choose from for our task, from the junction-table 'ProjectUser' in which we find all the users assigned to a project. if the task has no project we just let our "editorial user" manipulating the row, choose from ALL users.

furthermore, we dont want to choose from a mere combobox. for those fields >>>

the field for assigned users (not mainAssignee, mainAssignee should still show as Name but also when we click on it the same behaviour as for 'assigned users')should show not names but only AVATARS!(src/lib/components/ui/avatar)
>> for where we need to manipulate the fallback avater to show the initial letters of the username instead of some icon . F.I.: for Max Black 'MB'
> which should render from the shadcn avatar component,
and every AVATAR should hold a HOVERCARD!
>>> so that if we hover over or slightly tap it once on a mobile, the hovercard shows and gives us info.

> which should render from the shadcn HOVERCARD!(src/lib/components/ui/hover-card)
>> in which each hovercard should again hold the circular avatar for the user AND! addtionally the users full name, email, role and subroles written out.


so then if we want to manipulate the assigned users, we click on the assigned users field and it should come up with a modal or better 'dialog' which should render from the shadcn DIALOG!(src/lib/components/ui/dialog)...
> in this dialog box we want an area on the top of the dialog window, in which we again can see all the assigned users as avatars, (of course with the hovercards) but below that area we need a list-like possibility to select from all users...
I actually dont care if we choose for each user in a line starting with his avatar and right next to it his name, role, subroles, email, etc. wrapped in a button,
or if we use a mere table to display all the users to chosse from in that dialog.
but i want the line for the user to disappear if he is chosen to the assigned pool of users.
and
again..  the users we are/should be able to choose from: >>> its either all users or if the task has a project only the users assigned to the project..

and the same idea it is for 'Main Assignee' and 'Assigned Projects' ...only with the difference that for those we can only assign ONE .... and not several. 

 