Set oShell = CreateObject("Wscript.Shell")
Dim strArgs
strArgs = "node app.js"
oShell.Run strArgs, 0, false
