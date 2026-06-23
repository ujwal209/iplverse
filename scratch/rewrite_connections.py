import re

with open("app/dashboard/games/connections/page.tsx", "r") as f:
    content = f.read()

# I will replace the main wrapper div
# from: `<div className="flex flex-col min-h-screen bg-background text-foreground font-sans selection:bg-transparent">`
# to: `<div className="flex flex-col h-screen overflow-hidden bg-background text-foreground font-sans selection:bg-transparent">`

content = content.replace(
    '<div className="flex flex-col min-h-screen bg-background text-foreground font-sans selection:bg-transparent">',
    '<div className="flex flex-col h-[calc(100vh-5rem)] lg:h-screen overflow-hidden bg-background text-foreground font-sans selection:bg-transparent">'
)

content = content.replace(
    '<main className="flex-1 flex flex-col items-center w-full max-w-2xl mx-auto px-4 py-6 sm:py-8">',
    '<main className="flex-1 flex flex-col items-center w-full max-w-2xl mx-auto px-4 py-2 overflow-hidden">'
)

# the grid container 
content = content.replace(
    '<div className="w-full relative min-h-[400px]">',
    '<div className="w-full relative flex-1 flex flex-col justify-center min-h-0">'
)

content = content.replace(
    '<p className="text-base font-medium text-foreground mb-6">Create four groups of four!</p>',
    '<p className="text-sm font-medium text-foreground mb-2 sm:mb-4">Create four groups of four!</p>'
)

# The header padding
content = content.replace(
    '<header className="w-full flex flex-col items-center py-6 border-b border-border/50 bg-background/95 backdrop-blur sticky top-0 z-10">',
    '<header className="w-full flex flex-col items-center py-2 sm:py-4 border-b border-border/50 bg-background/95 backdrop-blur shrink-0">'
)

content = content.replace(
    '<h1 className="text-3xl font-bold tracking-tight mb-4 font-heading">Connections</h1>',
    '<h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2 font-heading">Connections</h1>'
)

# The bottom bar wrapper
content = content.replace(
    '<div className="flex flex-col items-center w-full mt-6 gap-6">',
    '<div className="flex flex-col items-center w-full mt-auto pt-4 gap-3 sm:gap-4 shrink-0 pb-4 sm:pb-8">'
)

content = content.replace(
    '<div className="w-full sticky bottom-4 z-10">',
    '<div className="w-full">'
)

content = content.replace(
    '<div className="flex flex-wrap items-center justify-center gap-3 w-full bg-background/90 backdrop-blur py-2 px-2 rounded-full shadow-[0_-10px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_-10px_20px_rgba(0,0,0,0.2)]">',
    '<div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 w-full max-w-[90%] mx-auto bg-background/90 backdrop-blur py-2 px-2 rounded-full">'
)

# Make tiles scale a bit smaller if needed to fit
content = content.replace(
    'aspect-[4/3] rounded-[6px] flex items-center justify-center text-center p-2 sm:p-3',
    'aspect-[4/3] sm:aspect-[2.5/1] rounded-[6px] flex items-center justify-center text-center p-1 sm:p-2'
)

content = content.replace(
    'text-[11px] sm:text-sm',
    'text-[10px] sm:text-xs'
)

with open("app/dashboard/games/connections/page.tsx", "w") as f:
    f.write(content)
print("Updated Connections page for single-screen layout.")
