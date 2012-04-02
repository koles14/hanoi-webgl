import sys
from xml.etree.ElementTree import parse

if len(sys.argv) < 2:
    print 'USAGE: python %s input.dae' % (sys.argv[0])
    sys.exit(1)

tree = parse(sys.argv[1])

for node in tree.getiterator():
    node.tag = node.tag.split('}')[-1]

meshes = tree.find('.//mesh');
for mesh in (meshes, ):
    vertexId = mesh.find('triangles/input[@semantic="VERTEX"]').attrib['source'][1:]
    texcoordNode = mesh.find('triangles/input[@semantic="TEXCOORD"]')
    texcoordId = None
    if texcoordNode is not None:
        texcoordId = texcoordNode.attrib['source'][1:]
    positionId = mesh.find('vertices[@id="%s"]/input[@semantic="POSITION"]' % vertexId).attrib['source'][1:]
    normalId = mesh.find('vertices[@id="%s"]/input[@semantic="NORMAL"]' % vertexId).attrib['source'][1:]

    positions = mesh.findtext('source[@id="%s"]/float_array' % positionId).split()
    normals = mesh.findtext('source[@id="%s"]/float_array' % normalId).split()
    texcoords = ()
    if texcoordId is not None:
        texcoords = mesh.findtext('source[@id="%s"]/float_array' % texcoordId, '').split()
    triangles = mesh.findtext('triangles/p').split()
    if texcoordId is not None:
        texindexes = triangles[1:None:2]
        triangles = triangles[0:None:2]
        a = []
        b = []
        c = []
        d = []
        j = 0
        for i in triangles:
            k = int(i)
            a += positions[3*k:3*k+3]
            b += normals[3*k:3*k+3]
            k = int(texindexes[j])
            c += texcoords[2*k:2*k+2]
            d += [str(j)]
            j += 1
        positions = a
        normals = b
        texcoords = c
        triangles = d

    texture = tree.findtext('library_images/image/init_from', '')

    print '{"vertex":[%s],"normal":[%s],"texcoord":[%s],"index":[%s],"texture":"%s"}' % (
            ','.join(positions),
            ','.join(normals),
            ','.join(texcoords),
            ','.join(triangles),
            texture)

