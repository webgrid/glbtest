static computeWeights(vertexdata: number[], voxeldata: boolean[][][], bones: Array < { name: string, index: number, length: number, parent: string, parentposition: _vector3, direction: _vector3, position: _vector3, metadata: any } >, diffratio: _vector3): { indexes: any, weights: any; } {
    let targetpositions = new Array<_vector3>();
    for (let i = 0; i < (vertexdata.length / 3); i++)
        targetpositions.push(_vector3.FromArray(vertexdata, i * 3));

    let targetmax = this._maxpoint(targetpositions);
    let targetmin = this._minpoint(targetpositions);
    let size = targetmax.subtract(targetmin);
    let voxeldims = [voxeldata.length - 1, voxeldata[0].length - 1, voxeldata[0][0].length - 1];
    bones.forEach(t => {
        t.position = new _vector3(t.position._x, t.position._y, t.position._z).multiply(diffratio);
        t.direction = new _vector3(t.direction._x, t.direction._y, t.direction._z).multiply(diffratio);
        if (t.parentposition != null) {
            t.parentposition = new _vector3(t.parentposition._x, t.parentposition._y, t.parentposition._z).multiply(diffratio);
            t.length = _vector3.Distance(t.parentposition, t.position);
        }
        else
            t.length = 0;
    });

    let maxdistance = size.x;
    if (size.y > maxdistance)
        maxdistance = size.y;
    if (size.z > maxdistance)
        maxdistance = size.z;

    let vertexweightmap = new Array<Array<{ boneindex: number, weight: number, distance: number; }>>();
    for (let i = 0; i < targetpositions.length; i++) {
        let vertex = targetpositions[i];
        let boneweights = new Array<{ boneindex: number, weight: number, distance: number; }>();
        let closestbone = 2;
        bones.forEach(b => {
            let weight: number;
            let distance = 0;

            if (b.metadata.noweight == true)
                weight = 0;
            else {

                if (vertex.multiply(b.direction).length() - (b.position.length()) > 0 || b.length < 0.001)
                    weight = 0;
                else {
                    distance = _vector3.Distance(vertex, b.position) / maxdistance; //normalize distance
                    if (distance > 1)
                        console.error(`computeweigh, expected distance between 0 and 1, got: ${distance}`);

                    if (distance >= closestbone - 0.01) //avoid clustering on a specific point
                        distance = 1;
                    else if (closestbone > distance)
                        closestbone = distance;

                    let deviation = 0.01; //influence tolerance


                    if (b.metadata.deviation != null)
                        deviation = b.metadata.deviation;

                    if (distance == 1)
                        weight = 0;
                    else {
                        if (computeworker.voxelcheck(vertex, b.position, voxeldata, targetmin, size, voxeldims))
                            weight = 1 / Math.sqrt(1 * Math.PI * deviation) * Math.exp(- distance * distance / (1 * deviation));
                        else
                            weight = 0;
                    }
                }
                if (b.metadata.weightfunc != null)
                    weight = b.metadata.weightfunc(b, weight, distance, vertex);
            }

            if (weight > 0)
                boneweights.push({ boneindex: b.index, weight: weight, distance: distance });
        });
        vertexweightmap.push(boneweights);
    }
    let ind = [];
    let wd = [];
    for (let ti = 0; ti < targetpositions.length; ti++) {
        let vertexinfo = vertexweightmap[ti];

        vertexinfo = vertexinfo.sort((a, b) => a.distance - b.distance).slice(0, 4);

        if (vertexinfo.length < 4)
            while (vertexinfo.length < 4)
                vertexinfo.push({ boneindex: -1, weight: 0, distance: 0 });

        let totalweight = vertexinfo.map(t => t.weight).reduce((a, b) => a + b);

        let bw0 = vertexinfo[0].weight / totalweight;
        let bw1 = vertexinfo[1].weight / totalweight;
        let bw2 = vertexinfo[2].weight / totalweight;
        let bw3 = vertexinfo[3].weight / totalweight;


        if (totalweight == 0)
            bw0 = bw1 = bw2 = bw3 = 0;


        let inx = ti * 4;
        ind[inx + 0] = vertexinfo[0].boneindex;
        ind[inx + 1] = vertexinfo[1].boneindex;
        ind[inx + 2] = vertexinfo[2].boneindex;
        ind[inx + 3] = vertexinfo[3].boneindex;

        wd[inx + 0] = bw0;
        wd[inx + 1] = bw1;
        wd[inx + 2] = bw2;
        wd[inx + 3] = bw3;
    }
    return { indexes: ind, weights: wd };
}

static _maxpoint(list: Array<_vector3>): _vector3 {
    const maxx = Math.max.apply(0, list.map(t => t.x));
    const maxy = Math.max.apply(0, list.map(t => t.y));
    const maxz = Math.max.apply(0, list.map(t => t.z));

    return new _vector3(maxx, maxy, maxz);
}

    static _minpoint(list: Array<_vector3>): _vector3 {
    const minx = Math.min.apply(0, list.map(t => t.x));
    const miny = Math.min.apply(0, list.map(t => t.y));
    const minz = Math.min.apply(0, list.map(t => t.z));

    return new _vector3(minx, miny, minz);
};
