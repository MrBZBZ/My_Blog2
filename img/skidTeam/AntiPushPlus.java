package dev.skidteam.mod.modules.impl.combat;

import dev.skidteam.api.utils.world.BlockPosX;
import dev.skidteam.core.impl.CommandManager;
import dev.skidteam.mod.modules.Module;
import dev.skidteam.mod.modules.settings.impl.BooleanSetting;
import dev.skidteam.mod.modules.settings.impl.EnumSetting;
import dev.skidteam.mod.modules.settings.impl.SliderSetting;
import net.minecraft.block.Block;
import net.minecraft.block.BlockState;
import net.minecraft.block.FacingBlock;
import net.minecraft.block.PistonBlock;
import net.minecraft.network.packet.c2s.play.PlayerMoveC2SPacket;
import net.minecraft.util.math.BlockPos;
import net.minecraft.util.math.Direction;
import net.minecraft.util.math.MathHelper;

import java.util.ArrayList;

public class AntiPushPlus extends Module {
    public static AntiPushPlus INSTANCE;
    
    private final BooleanSetting usingPause = this.add(new BooleanSetting("UsingPause", true));
    private final EnumSetting<LagBackMode> lagMode = add(new EnumSetting<>("LagMode", LagBackMode.TrollHack));
    private final SliderSetting smartX = add(new SliderSetting("SmartXZ", 3, 0, 10, 0.1, () -> lagMode.getValue() == LagBackMode.Smart ));
    private final SliderSetting smartUp = add(new SliderSetting("SmartUp", 3, 0, 10, 0.1, () -> lagMode.getValue() == LagBackMode.Smart));
    private final SliderSetting smartDown = add(new SliderSetting("SmartDown", 3, 0, 10, 0.1, () -> lagMode.getValue() == LagBackMode.Smart));
    private final SliderSetting smartDistance = add(new SliderSetting("SmartDistance", 2, 0, 10, 0.1, () -> lagMode.getValue() == LagBackMode.Smart));


    public AntiPushPlus() {
        super("AntiPush+", "Trap self when piston kick", Module.Category.Combat);
        INSTANCE = this;
        setChinese("反活塞推人+");
    }
    @Override
    public void onUpdate() {
        if (!this.usingPause.getValue() || !mc.player.isUsingItem()) {
            if (this.isPushing(mc.player.getBlockPos())) {
                lag();
                CommandManager.sendChatMessage("§c你被活塞推了！");
            }
            else if (!this.isPushing(mc.player.getBlockPos())){
                CommandManager.sendChatMessage("§a你没有被活塞推！");
            }
        }
    }
    private boolean isPushing(BlockPos playerPos) {
        int progress = 0;
        Direction[] directions = Direction.values();

        for (Direction direction : directions) {
            // 忽略向下和向上的方向
            if (direction != Direction.DOWN && direction != Direction.UP) {
                BlockPos offsetPos = playerPos.offset(direction).up();
                BlockState blockState = mc.world.getBlockState(offsetPos);
                Block block = blockState.getBlock();

                // 检查是否是活塞，活塞的方向是指向玩家的方向                右边这个是关于活塞是否充能的条件，可选择是否要使用 && blockState.get(PistonBlock.EXTENDED)
                if (block instanceof PistonBlock && blockState.get(PistonBlock.FACING).getOpposite() == direction) {
                    ++progress;
                }
            }
        }

        return progress > 0; // 这里假设你只需要判断是否存在这样的活塞
    }

    private Block getBlock(BlockPos block) {
        return mc.world.getBlockState(block).getBlock();
    }
    private void lag(){
        switch (lagMode.getValue()) {
            case Smart -> {
                ArrayList<BlockPos> list = new ArrayList<>();
                for (double x = mc.player.getPos().getX() - smartX.getValue(); x < mc.player.getPos().getX() + smartX.getValue(); ++x) {
                    for (double z = mc.player.getPos().getZ() - smartX.getValue(); z < mc.player.getPos().getZ() + smartX.getValue(); ++z) {
                        for (double y = mc.player.getPos().getY() - smartDown.getValue(); y < mc.player.getPos().getY() + smartUp.getValue(); ++y) {
                            list.add(new BlockPosX(x, y, z));
                        }
                    }
                }

                double distance = 0;
                BlockPos bestPos = null;
                for (BlockPos pos : list) {
                    if (!canMove(pos)) continue;
                    if (MathHelper.sqrt((float) mc.player.squaredDistanceTo(pos.toCenterPos().add(0, -0.5, 0))) < smartDistance.getValue())
                        continue;
                    if (bestPos == null || mc.player.squaredDistanceTo(pos.toCenterPos()) < distance) {
                        bestPos = pos;
                        distance = mc.player.squaredDistanceTo(pos.toCenterPos());
                    }
                }
                if (bestPos != null) {
                    mc.getNetworkHandler().sendPacket(new PlayerMoveC2SPacket.PositionAndOnGround(bestPos.getX() + 0.5, bestPos.getY(), bestPos.getZ() + 0.5, false));
                }
            }
            case Invalid -> {
                for (int i = 0; i < 20; i++)
                    mc.getNetworkHandler().sendPacket(new PlayerMoveC2SPacket.PositionAndOnGround(mc.player.getX(), mc.player.getY() + 1337, mc.player.getZ(), false));
            }
            case Fly -> {
                mc.getNetworkHandler().sendPacket(new PlayerMoveC2SPacket.PositionAndOnGround(mc.player.getX(), mc.player.getY() + 1.16610926093821, mc.player.getZ(), false));
                mc.getNetworkHandler().sendPacket(new PlayerMoveC2SPacket.PositionAndOnGround(mc.player.getX(), mc.player.getY() + 1.170005801788139, mc.player.getZ(), false));
                mc.getNetworkHandler().sendPacket(new PlayerMoveC2SPacket.PositionAndOnGround(mc.player.getX(), mc.player.getY() + 1.2426308013947485, mc.player.getZ(), false));
                mc.getNetworkHandler().sendPacket(new PlayerMoveC2SPacket.PositionAndOnGround(mc.player.getX(), mc.player.getY() + 2.3400880035762786, mc.player.getZ(), false));
                mc.getNetworkHandler().sendPacket(new PlayerMoveC2SPacket.PositionAndOnGround(mc.player.getX(), mc.player.getY() + 2.6400880035762786, mc.player.getZ(), false));
            }
            case Glide -> {
                mc.getNetworkHandler().sendPacket(new PlayerMoveC2SPacket.PositionAndOnGround(mc.player.getX(), mc.player.getY() + 1.0001, mc.player.getZ(), false));
                mc.getNetworkHandler().sendPacket(new PlayerMoveC2SPacket.PositionAndOnGround(mc.player.getX(), mc.player.getY() + 1.0405, mc.player.getZ(), false));
                mc.getNetworkHandler().sendPacket(new PlayerMoveC2SPacket.PositionAndOnGround(mc.player.getX(), mc.player.getY() + 1.0802, mc.player.getZ(), false));
                mc.getNetworkHandler().sendPacket(new PlayerMoveC2SPacket.PositionAndOnGround(mc.player.getX(), mc.player.getY() + 1.1027, mc.player.getZ(), false));
            }
            case TrollHack ->
                    mc.getNetworkHandler().sendPacket(new PlayerMoveC2SPacket.PositionAndOnGround(mc.player.getX(), mc.player.getY() + 2.3400880035762786, mc.player.getZ(), false));
            case Normal ->
                    mc.getNetworkHandler().sendPacket(new PlayerMoveC2SPacket.PositionAndOnGround(mc.player.getX(), mc.player.getY() + 1.9, mc.player.getZ(), false));
            case ToVoid ->
                    mc.getNetworkHandler().sendPacket(new PlayerMoveC2SPacket.PositionAndOnGround(mc.player.getX(), -70, mc.player.getZ(), false));
            case ToVoid2 ->
                    mc.getNetworkHandler().sendPacket(new PlayerMoveC2SPacket.PositionAndOnGround(mc.player.getX(), -7, mc.player.getZ(), false));
            case Rotation -> {
                mc.getNetworkHandler().sendPacket(new PlayerMoveC2SPacket.LookAndOnGround(-180, -90, false));
                mc.getNetworkHandler().sendPacket(new PlayerMoveC2SPacket.LookAndOnGround(180, 90, false));
            }
        }
    }
    private enum LagBackMode {
        Smart, Invalid, TrollHack, ToVoid, ToVoid2, Normal, Rotation, Fly, Glide,Strict
    }
    private boolean canMove(BlockPos pos) {
        return mc.world.isAir(pos) && mc.world.isAir(pos.up());
    }
}
