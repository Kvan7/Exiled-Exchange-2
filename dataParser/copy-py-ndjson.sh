

supported_languages=("en" "ru" "ko" "cmn-Hant" "ja" "de" "es" "pt")

for lang in "${supported_languages[@]}"; do
    echo "Copying $lang"
    mkdir -p ./data/$lang
    cp -R ./vendor/client/pyDumps/$lang/* ./data/$lang/
done

echo "Copying Generic Data"
mkdir -p ./data/generic
cp -R ./vendor/client/pyDumps/generic/* ./data/generic/