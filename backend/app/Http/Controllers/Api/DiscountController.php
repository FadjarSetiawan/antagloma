<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller; use App\Models\Discount; use Illuminate\Http\Request;
class DiscountController extends Controller {
    private function owner(Request $request): void { $role = $request->user()->role instanceof \BackedEnum ? $request->user()->role->value : (string) $request->user()->role; if ($role !== 'owner') abort(403); }
    public function index(Request $request) { $this->owner($request); return response()->json(['success'=>true,'data'=>Discount::latest()->get()]); }
    public function store(Request $request) { $this->owner($request); $data=$request->validate(['name'=>'required|string|max:255','type'=>'required|in:percentage,fixed','value'=>'required|numeric|min:0','is_active'=>'sometimes|boolean']); return response()->json(['success'=>true,'data'=>Discount::create($data)],201); }
    public function update(Request $request, Discount $discount) { $this->owner($request); $data=$request->validate(['name'=>'sometimes|required|string|max:255','type'=>'sometimes|required|in:percentage,fixed','value'=>'sometimes|required|numeric|min:0','is_active'=>'sometimes|boolean']); $discount->update($data); return response()->json(['success'=>true,'data'=>$discount->fresh()]); }
    public function destroy(Request $request, Discount $discount) { $this->owner($request); $discount->update(['is_active'=>false]); return response()->json(['success'=>true,'data'=>$discount->fresh()]); }
}
