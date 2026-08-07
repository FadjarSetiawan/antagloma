<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MasterGrade;
use App\Models\MasterTree;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MasterDataController extends Controller
{
    public function trees(): JsonResponse
    {
        $trees = MasterTree::orderBy('id', 'asc')->get();
        return response()->json([
            'success' => true,
            'data'    => $trees,
        ]);
    }

    public function grades(): JsonResponse
    {
        $grades = MasterGrade::orderBy('id', 'asc')->get();
        return response()->json([
            'success' => true,
            'data'    => $grades,
        ]);
    }

    public function storeTree(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:20', 'unique:master_trees,code'],
            'name' => ['required', 'string', 'max:255'],
        ]);

        $tree = MasterTree::create([
            'code' => strtoupper(trim($validated['code'])),
            'name' => trim($validated['name']),
        ]);

        AuditLogService::logSecurityEvent('MASTER_TREE_CREATED', $request->user(), [
            'tree_id' => $tree->id,
            'code'    => $tree->code,
            'name'    => $tree->name,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Varian pohon adenium berhasil ditambahkan.',
            'data'    => $tree,
        ], 201);
    }

    public function updateTree(Request $request, int $id): JsonResponse
    {
        $tree = MasterTree::findOrFail($id);

        $validated = $request->validate([
            'code' => ['required', 'string', 'max:20', 'unique:master_trees,code,' . $id],
            'name' => ['required', 'string', 'max:255'],
        ]);

        $tree->update([
            'code' => strtoupper(trim($validated['code'])),
            'name' => trim($validated['name']),
        ]);

        AuditLogService::logSecurityEvent('MASTER_TREE_UPDATED', $request->user(), [
            'tree_id' => $tree->id,
            'code'    => $tree->code,
            'name'    => $tree->name,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Varian pohon adenium berhasil diperbarui.',
            'data'    => $tree,
        ]);
    }

    public function destroyTree(Request $request, int $id): JsonResponse
    {
        $tree = MasterTree::findOrFail($id);
        $treeId = $tree->id;
        $treeCode = $tree->code;
        $treeName = $tree->name;

        $tree->delete();

        AuditLogService::logSecurityEvent('MASTER_TREE_DELETED', $request->user(), [
            'tree_id' => $treeId,
            'code'    => $treeCode,
            'name'    => $treeName,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Varian pohon adenium berhasil dihapus.',
        ]);
    }

    public function storeGrade(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'grade'          => ['required', 'string', 'max:10', 'unique:master_grades,grade'],
            'standard_price' => ['required', 'numeric', 'min:0'],
        ]);

        $grade = MasterGrade::create([
            'grade'          => strtoupper(trim($validated['grade'])),
            'standard_price' => $validated['standard_price'],
        ]);

        AuditLogService::logSecurityEvent('MASTER_GRADE_CREATED', $request->user(), [
            'grade_id'       => $grade->id,
            'grade'          => $grade->grade,
            'standard_price' => $grade->standard_price,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Grade adenium berhasil ditambahkan.',
            'data'    => $grade,
        ], 201);
    }

    public function updateGrade(Request $request, int $id): JsonResponse
    {
        $grade = MasterGrade::findOrFail($id);

        $validated = $request->validate([
            'grade'          => ['required', 'string', 'max:10', 'unique:master_grades,grade,' . $id],
            'standard_price' => ['required', 'numeric', 'min:0'],
        ]);

        $grade->update([
            'grade'          => strtoupper(trim($validated['grade'])),
            'standard_price' => $validated['standard_price'],
        ]);

        AuditLogService::logSecurityEvent('MASTER_GRADE_UPDATED', $request->user(), [
            'grade_id'       => $grade->id,
            'grade'          => $grade->grade,
            'standard_price' => $grade->standard_price,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Grade adenium berhasil diperbarui.',
            'data'    => $grade,
        ]);
    }

    public function destroyGrade(Request $request, int $id): JsonResponse
    {
        $grade = MasterGrade::findOrFail($id);
        $gradeId = $grade->id;
        $gradeName = $grade->grade;

        $grade->delete();

        AuditLogService::logSecurityEvent('MASTER_GRADE_DELETED', $request->user(), [
            'grade_id' => $gradeId,
            'grade'    => $gradeName,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Grade adenium berhasil dihapus.',
        ]);
    }
}
