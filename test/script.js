const canvas = document.getElementById('plot');

fetch('data.json')
    .then(result => result.json())
    .then(data => {
        const zoomFactor = 5;

        let width = 600 * zoomFactor;
        let height = 6000 * zoomFactor;

        // for (const arr of data) {
        //     for (let i = 0; i < arr.points.length; i++) {
        //         const x = arr.points[i].x;
        //         const y = arr.points[i].y;
        //         if (width < x) width = x;
        //         if (height < y) height = y;
        //     }
        // }
        //
        // for (const media of medias) {
        //     const {x,y} = media.end;
        //     if (width < x) width = x;
        //     if (height < y) height = y;
        // }

        canvas.width = width;
        canvas.height = height;

        if (canvas.getContext) {
            var ctx = canvas.getContext('2d');

            function drawPoint(coordinate) {
                const {x,y} = coordinate;
                ctx.beginPath();
                ctx.arc(x * zoomFactor, y * zoomFactor, zoomFactor, 0, 2 * Math.PI)
                ctx.stroke();
                ctx.fillStyle = "red";
                ctx.fill();
                ctx.closePath()
            }

            const NTypes = {
                CURVE: 0,
                SHAPE: 1,
                MEDIA: 2,
            };

            for (let i = 0; i < data.length; i++) {
                const instruction = data[i];
                const ntype = instruction['@NType'];
                switch (ntype) {
                    case NTypes.MEDIA:
                        const path = instruction.path;
                        const img = document.createElement('img', { src: path, id: 'img1' });
                        img.src = path;
                        img.id = 'img' + i;
                        img.style = 'display: none;';
                        img.onload = function () {
                            const {x,y} = instruction.origin;
                            const {width, height} = instruction.dimension;
                            ctx.drawImage(document.getElementById('img' + i), x * zoomFactor, y * zoomFactor, width * zoomFactor, height * zoomFactor);
                        }
                        document.body.appendChild(img)
                        break;
                    case NTypes.CURVE:
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(${instruction.color.r}, ${instruction.color.g}, ${instruction.color.b}, ${instruction.color.a})`;
                        for (let i = 0; i < instruction.points.length; i++) {
                            const x = instruction.points[i].x * zoomFactor;
                            const y = instruction.points[i].y * zoomFactor;
                            if (i === 0) {
                                ctx.moveTo(x, y);
                            } else {
                                ctx.lineTo(x, y)
                            }
                        }
                        ctx.stroke();
                        ctx.closePath();
                        break;
                    case NTypes.SHAPE:
                        switch (instruction.type) {
                            case 'line':
                                const {start, end} = instruction;
                                ctx.beginPath();
                                ctx.moveTo(start.x * zoomFactor, start.y * zoomFactor);
                                ctx.lineTo(end.x * zoomFactor, end.y * zoomFactor);
                                ctx.stroke();
                                ctx.closePath();
                                break;
                            case 'rectangle':
                                const {points} = instruction;
                                ctx.beginPath();
                                for (let i = 0; i < points.length; i++) {
                                    const x = points[i].x * zoomFactor;
                                    const y = points[i].y * zoomFactor;
                                    if (i === 0) {
                                        ctx.moveTo(x, y);
                                    } else {
                                        ctx.lineTo(x, y)
                                    }
                                }
                                ctx.lineTo(points[0].x * zoomFactor, points[0].y * zoomFactor);
                                ctx.stroke();
                                ctx.closePath();
                                break;
                            case 'circle':
                                console.warn('Circle: ', instruction);
                                const {center, radius, debugPoints} = instruction;
                                ctx.beginPath();
                                ctx.arc(center.x * zoomFactor, center.y * zoomFactor, radius * zoomFactor, 0, 2 * Math.PI);
                                ctx.stroke();
                                ctx.closePath();
                                if (debugPoints && debugPoints.length) {
                                    for (const point of debugPoints) {
                                        drawPoint(point);
                                    }
                                }
                                break;
                            case 'ellipse':
                                console.warn('Ellipse: ', instruction);
                                const {center: centerEllipse, radiusX, radiusY, rotation, debugPoints: debugPointsEllipse} = instruction;
                                ctx.beginPath();
                                const rot = rotation;
                                console.log(rot);
                                ctx.ellipse(centerEllipse.x * zoomFactor, centerEllipse.y * zoomFactor, radiusX * zoomFactor, radiusY * zoomFactor, rot,0, 2 * Math.PI);
                                ctx.stroke();
                                ctx.closePath();
                                if (debugPointsEllipse && debugPointsEllipse.length) {
                                    for (const point of debugPointsEllipse) {
                                        drawPoint(point);
                                    }
                                }
                                break;
                            case 'partialshape':
                                const {debugPoints: debugPointsPartialShape} = instruction;
                                if (debugPointsPartialShape && debugPointsPartialShape.length) {
                                    for (const point of debugPointsPartialShape) {
                                        drawPoint(point);
                                    }
                                }
                                break;
                            default:
                                console.warn('Unknown shape type: ', instruction);
                                break;
                        }
                        break;
                    default:
                        console.warn('Unknown draw instruction: ', instruction);
                        break;
                }
            }
        }
    });
