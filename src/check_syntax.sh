for i in *.js; do
    node --check "$i" || break
done