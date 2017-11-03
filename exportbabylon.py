import bpy,bmesh

import sys
argv = sys.argv
argv = argv[argv.index("--") + 1:]  # get all args after "--"
print(argv)  # --> ['example', 'args', '123']

# import ply
bpy.ops.import_mesh.ply(filepath="D:\\code\\babylonrpg\\" + argv[0])

# output babylon
bpy.ops.scene.babylon(filepath="D:\\code\\babylonrpg\\" + argv[1])