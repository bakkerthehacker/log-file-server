

large file testing:

generate large "log" file using:

`cat linuxmint-21.3-cinnamon-64bit.iso | base64 | fmt -w 300 | tr ' ' '\n' > fakelog.log`

mostly alphabet with lines of 300 chars

3.9G after converting to fakelog.log



## manual tests:

#### curling the entire log

`curl --verbose 'http://localhost:3000/logs?filename=fakelog.log' > /dev/null`

7m25s

8.87 MB/s


#### curling with an easy filter and count

`curl --verbose 'http://localhost:3000/logs?filename=fakelog.log&filter=AA&count=3' > /dev/null`

58ms



#### curling with a difficult filter and count

the filter appears only at the very beginning of the fake log file (end of the search)

`curl --verbose 'http://localhost:3000/logs?filename=fakelog.log&filter=ZXJhdGluZyBzeXN0ZW0gbG9hZCBlcnJvci4NCl6stA6KPmIEswfNEDwKdfHNGPT&count=3' > /dev/null`

21s


### curling the file into a full file

to test that the server doesnt use too much memory when the client 

memory stays reasonable when running, no heap oom