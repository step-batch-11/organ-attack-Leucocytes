#! /bin/bash
cp hooks/* .git/hooks/

chmod u+x .git/hooks/pre-commit .git/hooks/pre-push
