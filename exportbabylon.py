import bpy,bmesh

import sys
argv = sys.argv
argv = argv[argv.index("--") + 1:]  # get all args after "--"
print(argv)  # --> ['example', 'args', '123']

# import file
bpy.ops.import_mesh.ply(filepath="D:\\code\\babylonrpg\\assets\\plys\\" + argv[0] + ".ply")

bpy.ops.scene.babylon(filepath="D:\\code\\babylonrpg\\assets\\models\\" + argv[0] + ".babylon")