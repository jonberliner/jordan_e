expFolderName=${PWD##*/}
syncConfig=${1:0}
if [syncConfig==1]
then
    rsync -rav --exclude='.git' --exclude='.DS_Store' --exclude='*.c' --exclude='*.so' --exclude='sync2aws.sh' --exclude='build' --exclude='test.db' --exclude='server.log' --exclude='*.pyc' --exclude='psd' ./* aws:$expFolderName
else
    echo 'WARNING: not syncing config.txt!\n'
    rsync -rav --exclude='.git' --exclude='.DS_Store' --exclude='*.c' --exclude='*.so' --exclude='sync2aws.sh' --exclude='build' --exclude='config.txt' --exclude='test.db' --exclude='server.log' --exclude='*.pyc' --exclude='psd' ./* aws:$expFolderName
fi
