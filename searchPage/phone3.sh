#!/bin/sh
echo "Content-Type: text/plain"; echo
q1=`echo 'daniel' | awk '{ n=split($0, x, "%20"); print x[1]}' `
q2=`echo 'daniel' | awk '{ n=split($0, x, "%20"); print x[2]}' `
q3=`echo 'daniel' | awk '{ n=split($0, x, "%20"); print x[3]}' `
grep -i "$q1" phone.txt |
grep -i ".$q2" |
grep -i ".$q3" 