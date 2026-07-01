Output billet-demo.gif
Set FontSize 22
Set Width 1200
Set Height 720
Set Padding 24
Set WaitTimeout 30s

Type "bun start --cwd /tmp/billet-demo"
Enter
Wait+Screen /available commands/        # REPL is ready once the help line prints

Type "Create fizzbuzz.ts that prints FizzBuzz for 1 to 20, then run it with bun"
Enter
Wait        # wait until the REPL prompt returns (turn finished); uses default WaitPattern

Screenshot portfolio-still.png

Type "Now make it go up to 30 and run it again"
Enter
Wait        # same: wait for the turn to finish rather than a fixed Sleep

Type "/exit"
Enter
Sleep 1s
