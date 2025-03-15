# Docker Homelab
This is the neccessary files to quick start a docker compose stack. There are lots of different images/containers used in this stack ranging from media management to discord bots.
Please note that if you're going to attempt to recreate this stack you may need to adjust user permissions accordingly, folders should be created automatically but may not be accessible to the containers.

## Script Usage
In this docker compose stack I have made several bash scripts to make managing the stack a bit easier (on Linux). To use them just use sudo sh {command_name).sh, they will need sudo permissions to run.
Some of the commands have extra flags, use -h to learn more about each command.

## Environment File
You'll have to edit ".env-example" before running starting the stack with docker compose up as the env file contains neccessary information about where to make config files/folders.
Please make sure all file paths are corrected before running. This stack should work on any OS so long as the / gets corrected to \
