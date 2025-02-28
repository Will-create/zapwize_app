mkdir -p .bundle

cd .bundle
cp -a ../controllers/ controllers
cp -a ../definitions/ definitions
cp -a ../modules/ modules
cp -a ../plugins/ plugins
cp -a ../public/ public
cp -a ../schemas/ schemas
cp -a ../views/ views
cp -a ../templates/ templates
cp -a ../flow-db.js flow-db.js
cp -a ../flow-ui.js flow-ui.js
cp -a ../database.sql database.sql

# cd ..
total5 --bundle app.bundle
cp app.bundle ../--bundles--/app.bundle

cd ..
rm -rf .bundle
echo "DONE"