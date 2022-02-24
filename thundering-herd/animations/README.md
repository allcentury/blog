# Animations

Animations for the thundering herd use the HTML Canvas element.

How they work are fairly simple and contrived, but the flow is:

1. Paint jobs + External Service boxes on each frame
1. Determine shortest path from jobs -> service using A*
1. Move a smaller box (called a request - currently 5x5px) from upper left quadrant of jobs box to middle of external service box
1. Repaint previous paths to background color (white)

This is my first time using canvas or the JS libraries supporting it.  I suspect there is a lot of room for improvement here.  You can change variables in [thundering-herd.js](./thundering-herd.js).

## Local Development

```
bower install
```

```
open index.html
```

