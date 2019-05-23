#!/bin/sh
d=2018-01-01
while [ "$d" != $(date -I) ]; do 
  echo $d
  /bin/node ./greystone.js $d
  d=$(date -I -d "$d + 1 day")
done
