#! /bin/bash

chmod u+x ./hooks/pre-commit
chmod u+x ./hooks/pre-push

echo "Execute permission set"

ln -s ../../hooks/pre-commit .git/hooks/pre-commit
ln -s ../../hooks/pre-push .git/hooks/pre-push

echo "Sym links created no need to copy hooks in the '.git/hooks/' folder "

touch .env 

