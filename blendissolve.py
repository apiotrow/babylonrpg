#use: blender --background --python pythonOptPly.py -- fileYouWannaDo.ply
#ex. blender --background --python -- pythonOptPly.py

import bpy,bmesh

import sys
argv = sys.argv
argv = argv[argv.index("--") + 1:]  # get all args after "--"
print(argv)  # --> ['example', 'args', '123']

# import file
bpy.ops.import_mesh.ply(filepath="D:\\code\\babylonrpg\\" + argv[0])

# reduce faces
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.dissolve_limited()

bpy.ops.object.mode_set(mode='OBJECT')
me = bpy.context.active_object.data
bpy.ops.object.mode_set(mode='EDIT')
bm = bmesh.from_edit_mesh(me)

# triangulate everything
bmesh.ops.triangulate(bm, faces=bm.faces[:], quad_method=0, ngon_method=0)
bmesh.update_edit_mesh(me, True)

# export file
bpy.ops.export_mesh.ply(filepath="D:\\code\\babylonrpg\\" + argv[0], use_normals=False)