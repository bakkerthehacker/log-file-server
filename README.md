



### How to run:

`npm run start`

Port can be adjusted using `PORT` env variable, default is 3000.

### Paths:


`/logs`

The only important url when using the log server is `/logs`.  This takes 3 parameters, 1 is non-optional:

- filename
  - the location of the log file of interest
  - the filename (or path) is relative to the system path: `/var/logs`
  - Examples:
    - `filename=dmesg`
    - `filename=fakelog.log`

- filter
  - an optional filter to restrict which log lines appear
  - each log line must contain the filter text to be selected
  - the filter is case insensitive, the exact case of the filter must match the logs
  - Examples:
    - `filter=kernel`
    - `filter=Bluetooth`

- count
  - an optional limit to the number of log lines to return
  - Examples:
    - `count=1000`
    - `count=10`


### Curl Example:

As an example,
  - if the log you want to look at is `/var/log/dmesg`
  - and the filter is for log lines containing the text `Bluetooth`
  - and you only want the latest 3 log lines

the curl command to see these logs is:

`curl 'http://server.example:3000/logs?filename=dmesg&filter=Bluetooth&count=3'`

Replace `server.example` with the server hostname and `3000` with the customized `PORT`


### TODO / Improvements

- Restart server automatically when it fails (for connection reset or other reasons)
  - curl pipe to `/dev/full` crashes the server
- Split up functions into more files
- List out available logs
- Faster log streaming
- Write tests
- Case insensitive log matching
- Regex log matching
- JSON format/wrapping with more info, maybe on another path
- Linting, correct formatting
- Optimizations for multiple clients accessing the same file
