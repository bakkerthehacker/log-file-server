

large file testing:

generate large "log" file using:

`cat linuxmint-21.3-cinnamon-64bit.iso | base64 | fmt -w 300 | tr ' ' '\n' > fakelog.log`

mostly alphabet with lines of 300 chars
3.9G after converting to fakelog.log

manual tests:

curling the entire log
`curl --verbose 'http://localhost:3000/logs?filename=fakelog.log' > /dev/null`
